import { describe, expect, it } from 'bun:test';
import ts from 'typescript';
import { collectFunctions, type FnRange, functionHitCount, parseLcov } from '../../../scripts/lcovToIstanbulCore';

describe('parseLcov', () => {
	it('parses source file paths and line hits', () => {
		const files = parseLcov(`SF:src/example.ts
DA:10,1
DA:11,0
end_of_record`);
		expect(files).toHaveLength(1);
		expect(files[0]?.path).toBe('src/example.ts');
		expect(files[0]?.lines.get(10)).toBe(1);
		expect(files[0]?.lines.get(11)).toBe(0);
	});
});

describe('functionHitCount', () => {
	it('returns zero when no covered lines exist in the function range', () => {
		const fn: FnRange = { name: 'example', startLine: 1, endLine: 3 };
		const lines = new Map<number, number>([[4, 1]]);
		expect(functionHitCount(lines, fn)).toBe(0);
	});

	it('returns at least one when a covered line exists in the function range', () => {
		const fn: FnRange = { name: 'example', startLine: 1, endLine: 3 };
		const lines = new Map<number, number>([[2, 4]]);
		expect(functionHitCount(lines, fn)).toBe(4);
	});
});

describe('collectFunctions', () => {
	it('collects named function declarations from source text', () => {
		const sourceFile = ts.createSourceFile(
			'example.ts',
			'export function greet() { return "hi"; }',
			ts.ScriptTarget.Latest,
			true,
		);
		expect(collectFunctions(sourceFile)).toEqual([{ name: 'greet', startLine: 1, endLine: 1 }]);
	});

	it('collects arrow functions assigned to variables', () => {
		const sourceFile = ts.createSourceFile('example.ts', 'const add = () => 1;', ts.ScriptTarget.Latest, true);
		expect(collectFunctions(sourceFile)).toEqual([{ name: 'add', startLine: 1, endLine: 1 }]);
	});

	it('ignores anonymous arrow functions', () => {
		const sourceFile = ts.createSourceFile('example.ts', '(() => 1)();', ts.ScriptTarget.Latest, true);
		expect(collectFunctions(sourceFile)).toEqual([]);
	});
});
