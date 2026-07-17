---
name: finalize
description: >
  Continuous quality fix loop in caveman mode. Regenerates Supabase types once, then
  runs check, CI checks, and Fallow in order; fixes failures and repeats until all
  three pass. Fallow failures loop on fallow only until green, then restarts from
  check once. Use when the user asks to finalize, clean up before commit/PR, or get
  the repo green.
---

# Finalize: continuous quality fix loop

Ensure the codebase is fully clean and passes all required checks. Run **Step 0** once at the start (outside the loop). The skill is **complete only when the three loop commands pass consecutively with exit code 0**.

## Communication: caveman mode

**Read and follow** `.agents/skills/caveman/SKILL.md` for the entire finalize run.

- Default intensity: **full** (user can override with `/caveman lite|full|ultra`).
- Stay in caveman for status updates, failure analysis, and fix summaries.
- Code, diffs, and error output stay exact — caveman rules do not abbreviate those.
- Revert to normal mode only if user says "stop caveman" or "normal mode".

Example progress line: `check:fallow fail. dupes in fetchStudents.ts. Fix. Retry fallow only.`
Example done line: `All green. check + ci + fallow pass.`

## What `check:fallow` gates

The root script runs `bunx fallow --quiet --fail-on-issues`. Project config lives in `.fallowrc.json`. Combined mode fails on:

| Category | Trigger | Fix approach |
|----------|---------|--------------|
| Dead code | `--fail-on-issues` + unused files/exports/deps | Remove dead code, or trace with `fallow dead-code --trace-file` / `--trace-dependency` before deleting |
| Duplication | duplicate findings above project thresholds | Extract shared helper/module; dedupe clone groups Fallow reports |
| Complexity | Health findings above thresholds | Extract helpers, split components — see `.cursor/rules/fallow.mdc` |

Never use `// fallow-ignore` suppressions, `_`-prefix hacks, or relax Fallow thresholds to pass — see `.cursor/rules/fallow.mdc`.

## When to Use

- User asks to finalize, polish, or "get it green"
- Before committing or opening a PR
- After a feature branch is functionally done and needs a quality pass

## Commands (strict order)

Run from the repository root. Do not skip steps or reorder.

| Step | Command | What it checks | Loop |
|------|---------|----------------|------|
| 0 | `bun supabase:types` | Regenerate Supabase client types (`scripts/gen-supabase-types.ts`, linked project, no DB reset) | **Once** at start only |
| 1 | `bun check` | Biome check + auto-fix (`biome check --write`) | Outer loop |
| 2 | `bun check:ci` | Biome CI + TypeScript (`tsc -b --noEmit`) + unit tests (`bun test code`) | Outer loop |
| 3 | `bun check:fallow` | Full Fallow gate: dead code, duplication, complexity | Outer loop (+ inner loop on failure) |

**Bootstrap (once):**

```bash
bun supabase:types
```

**Outer loop:**

```bash
bun check
bun check:ci
bun check:fallow
```

## Command execution (mandatory)

Run each command **exactly** as written — one literal string per invocation:

| Do | Don't |
|----|-------|
| `bun supabase:types` | `bun run db:reset` (destructive; user-only — never run during finalize) |
| `bun check` | `cd /home/martijn/git/mcp && bun check` |
| `bun check:ci` | `bun run format` (wrong script; format is format-only) |
| `bun check:fallow` | `npx fallow audit ...` (bypasses package.json script) |

Rules:

1. **No prefixes or chaining** — no `cd`, `&&`, `;`, pipes, or absolute paths in the command string.
2. **No substitutions** — do not expand scripts into their underlying `bunx` / `npx` equivalents; use the `bun …` scripts from `package.json`.
3. **One command per shell call** — run each step as a separate invocation.
4. **Repository root** — if the shell is not already at the project root, set `working_directory` to the repo root; do not embed `cd` in the command.
5. **Step 0 is not in the loop** — run `bun supabase:types` exactly once before the first outer-loop pass; do not re-run it after check/CI/fallow failures or when restarting the outer loop.
6. **Never run `bun run db:reset`** — that resets the linked DB. Types-only regen is Step 0; if types are wrong because migrations are missing, escalate and ask the user to run `bun run db:reset`.

## Loop behavior

### Bootstrap (once, before the loop)

1. Run **Step 0** (`bun supabase:types`).
2. If it fails, capture output, fix the root cause, and re-run **Step 0** until it exits 0.
3. When Step 0 is green, enter the outer loop. **Do not run Step 0 again** — not after check/CI/fallow fixes, not when restarting the outer loop, not after the fallow inner loop.

Generated types may change `check:ci` (TypeScript); that is why Step 0 runs before the loop, not inside it.

### Outer loop (full pipeline)

1. Run **Step 1** (`bun check`).
2. If it succeeds, run **Step 2** (`bun check:ci`).
3. If that succeeds, run **Step 3** (`bun check:fallow`).
4. If all three pass, the skill is **done**.

### On failure

| Failed step | After fix, re-run |
|-------------|-------------------|
| `bun check` | **Step 1** — full pipeline from check |
| `bun check:ci` | **Step 1** — full pipeline from check |
| `bun check:fallow` | **Step 3 only** — fallow inner loop (see below) |

Do not proceed to the next step while the current one is failing.

### Fallow inner loop

When **only** `bun check:fallow` fails (check and CI already green in this outer pass):

1. Capture and analyze the full Fallow output.
2. Fix the root cause (prefer minimal, targeted fixes: extract helper, split component, dedupe, remove dead code). **Never** use fallow suppressions or relax thresholds — see `.cursor/rules/fallow.mdc`.
3. Re-run **only** `bun check:fallow` — do **not** re-run check or CI yet.
4. Repeat steps 1–3 until `bun check:fallow` exits 0.
5. When fallow is green, **restart the outer loop from Step 1** (`bun check`) once to confirm check + CI + fallow still pass together.

### Fix priority within Fallow

When multiple Fallow categories fail at once, fix in this order:

1. **Dead code** — remove or wire up unused exports/files/deps first (often shrinks dupes/complexity noise).
2. **Duplication** — extract shared functions/modules for reported clone groups.
3. **Complexity** — refactor functions above cyclomatic/cognitive/CRAP thresholds.

If the verification pass fails on check or CI, treat it like any other outer-loop failure (restart from Step 1). If it fails on fallow again, re-enter the fallow inner loop.

**Why:** Fallow fixes rarely need another check/CI run before the next fallow attempt. Re-running all three after every fallow tweak is slow. One full pass at the end catches anything Fallow fixes broke.

### On failure (check / CI)

If `bun check` or `bun check:ci` fails:

1. Capture and analyze the full error output.
2. Fix the root cause in the codebase (prefer minimal, targeted fixes).
3. **Restart from Step 1** (`bun check`).
4. Repeat until all three commands pass in one consecutive outer run (with fallow inner loop as needed).

### Fix priority within a failing step

`check:ci` chains `biome ci && tsc -b && bun test code`, so a failure can have multiple causes at once. Fix in this order and do not chase downstream symptoms:

1. **Biome / check** errors first.
2. **Type errors** (`tsc`) next — these often cause the test failures below.
3. **Code test failures** last (`tests/code/` only). **Do not edit tests while `tsc` still fails** — re-run after types are green; failures often disappear on their own.
4. **Fallow** findings only once `check:ci` is green. Within Fallow: dead code → duplication → complexity.

`check:ci` runs **only** `bun test code` (unit tests under `tests/code/`). Do **not** run `tests/auth`, `tests/rls`, or `tests/e2e` as part of finalize — those need Supabase and are outside this skill.

### When to stop and escalate

Do not loop forever. Stop and ask the user when any of these hold:

1. **No progress (primary signal)** — after a fix attempt, the failure count does not drop. Track a simple count each iteration: number of Biome errors + `tsc` errors + failing code tests + Fallow findings. If two consecutive iterations do not lower that count, stop — the fixes are not working. Count fallow-only retries separately from full outer passes.
2. **Iteration cap (hard backstop)** — 5 full outer-loop passes without reaching all-green, or 10 consecutive fallow-only retries without green. Safety net; the no-progress signal should normally trigger first.
3. **Out-of-scope fix** — the failure needs a design decision, a destructive change, or a change clearly outside the current task.
4. **Ambiguous failure** — the root cause is unclear after analyzing the full output.
5. **Types out of sync with schema** — `supabase:types` or `tsc` fails because migrations are not applied on the linked DB. Ask the user to run `bun run db:reset`; do not run it yourself.

On escalation, report the failing step, the exact error, and what was tried, then ask the user how to proceed (prefer a structured choice of options). Do not commit or keep retrying blindly.

## Success condition

Step 0 (`bun supabase:types`) must have completed successfully once before the loop. The skill is done only when one **outer** pass completes with no fallow inner loop pending:

- `bun check` completes with no errors (no remaining Biome issues)
- `bun check:ci` exits with code 0
- `bun check:fallow` exits with code 0

If fallow needed fixes, the winning outer pass is the **verification** run after the fallow inner loop turned green — not the inner-loop attempt alone.

## Language: English vs Dutch

**Enforce during finalize (before declaring success):**

- All **code**, **tests**, **comments**, and **CLI tool** input/output must be in **English**.
- **Only** the front-end UI (labels, buttons, error messages, placeholders, user-facing copy) is in **Dutch** in this project.
- Docs under `./docs/` stay Dutch; that is outside this gate unless you touch them while fixing.

If you find Dutch (or other non-English) in code identifiers, test names/`describe`/`it` strings, comments, or CLI strings while fixing, convert them to English. Do not change front-end UI copy to English.

## Agent rules

1. **Use caveman mode** — see Communication section above; load caveman skill at start.
2. **Run Step 0 once** — `bun supabase:types` before the first outer-loop pass; never re-run inside the loop; never use `db:reset`.
3. **Run commands exactly** — see Command execution section; literal `bun supabase:types` / `bun check` / `bun check:ci` / `bun check:fallow` only.
4. **Restart rules** — check/CI failure → restart from `bun check`. Fallow-only failure → loop `bun check:fallow` until green, then one full pass from `bun check`. Do **not** restart from check after every fallow fix.
5. **Do not skip steps** in the outer loop — always run check → ci → fallow in order.
6. **Prefer minimal fixes** over large refactors unless the failure clearly requires structural change.
7. **Keep iterating** until the full pipeline is green; do not stop after a partial pass.
8. **Fix in priority order** — Biome → type errors → code tests → Fallow; never edit tests while `tsc` fails.
9. **Enforce English** — code, tests, comments, and CLI I/O in English; front-end UI stays Dutch. See Language section.
10. **Escalate, don't loop forever** — see "When to stop and escalate"; stop when the failure count stalls for two iterations, after outer/inner caps, or on out-of-scope/ambiguous failures.
11. **Do not commit** unless the user explicitly asks.
