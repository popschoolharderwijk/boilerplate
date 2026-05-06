#!/usr/bin/env bun
/**
 * Targeted RLS test runner for lesson_agreements + lesson_signup_requests.
 *
 * Verifies per-role visibility (impersonation via Supabase auth signin) for:
 *   - tests/rls/lesson-agreements/**
 *   - tests/rls/lesson-signup-requests/**
 *
 * Required env (load via `.env.development` / `.env.test`):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_PUBLISHABLE_DEFAULT_KEY
 *   VITE_DEV_LOGIN_PASSWORD
 *
 * Usage:
 *   bun run test:rls:agreements-and-signups
 *   # or filter by name:
 *   bun run test:rls:agreements-and-signups -- -t "site_admin"
 */
import { spawnSync } from 'node:child_process';

const required = [
	'SUPABASE_URL',
	'SUPABASE_SERVICE_ROLE_KEY',
	'SUPABASE_PUBLISHABLE_DEFAULT_KEY',
	'VITE_DEV_LOGIN_PASSWORD',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
	console.error(`[rls-runner] Missing env vars: ${missing.join(', ')}`);
	console.error('[rls-runner] Source your .env.development before running.');
	process.exit(1);
}

const extra = process.argv.slice(2);
const args = ['test', 'tests/rls/lesson-agreements', 'tests/rls/lesson-signup-requests', ...extra];

console.log(`[rls-runner] bun ${args.join(' ')}`);
const result = spawnSync('bun', args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
