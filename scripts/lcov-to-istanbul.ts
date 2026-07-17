/**
 * Convert Bun's lcov.info into Istanbul coverage-final.json for Fallow CRAP scoring.
 * Bun emits line hits (DA) but no FN/FNDA records, so we rebuild fnMap from the TypeScript AST
 * and attribute line hits to each function's line range.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { collectFunctions, functionHitCount, type LcovFile, parseLcov } from './lcovToIstanbulCore.ts';

async function toIstanbulFile(projectRoot: string, file: LcovFile) {
	const absPath = path.isAbsolute(file.path) ? file.path : path.join(projectRoot, file.path);
	const relPath = path.relative(projectRoot, absPath);
	const sourceText = await readFile(absPath, 'utf8');
	const sourceFile = ts.createSourceFile(relPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

	const statementMap: Record<
		string,
		{ start: { line: number; column: number }; end: { line: number; column: number } }
	> = {};
	const s: Record<string, number> = {};
	let stmtIdx = 0;
	for (const [lineNo, hits] of [...file.lines.entries()].sort((a, b) => a[0] - b[0])) {
		const key = String(stmtIdx++);
		statementMap[key] = {
			start: { line: lineNo, column: 0 },
			end: { line: lineNo, column: 500 },
		};
		s[key] = hits;
	}

	const fnMap: Record<
		string,
		{
			name: string;
			decl: { start: { line: number; column: number }; end: { line: number; column: number } };
			loc: { start: { line: number; column: number }; end: { line: number; column: number } };
			line: number;
		}
	> = {};
	const f: Record<string, number> = {};
	let fnIdx = 0;
	for (const fn of collectFunctions(sourceFile)) {
		const key = String(fnIdx++);
		fnMap[key] = {
			name: fn.name,
			decl: {
				start: { line: fn.startLine, column: 0 },
				end: { line: fn.startLine, column: fn.name.length },
			},
			loc: {
				start: { line: fn.startLine, column: 0 },
				end: { line: fn.endLine, column: 500 },
			},
			line: fn.startLine,
		};
		f[key] = functionHitCount(file.lines, fn);
	}

	return {
		path: absPath,
		statementMap,
		fnMap,
		branchMap: {},
		s,
		f,
		b: {},
	};
}

async function main() {
	const projectRoot = process.cwd();
	const lcovPath = path.join(projectRoot, 'coverage', 'lcov.info');
	const outPath = path.join(projectRoot, 'coverage', 'coverage-final.json');
	const content = await readFile(lcovPath, 'utf8');
	const files = parseLcov(content);
	const map: Record<string, Awaited<ReturnType<typeof toIstanbulFile>>> = {};
	for (const file of files) {
		try {
			const entry = await toIstanbulFile(projectRoot, file);
			map[entry.path] = entry;
		} catch (error) {
			console.warn(`Skipping ${file.path}:`, error instanceof Error ? error.message : error);
		}
	}
	await mkdir(path.dirname(outPath), { recursive: true });
	await writeFile(outPath, `${JSON.stringify(map)}\n`);
	const withFns = Object.values(map).filter((e) => Object.keys(e.f).length > 0).length;
	console.log(
		`Wrote ${Object.keys(map).length} files (${withFns} with fnMap) to ${path.relative(projectRoot, outPath)}`,
	);
}

await main();
