import { describe, expect, it } from 'bun:test';
import {
	getMarkdownHeadingClass,
	getMarkdownHeadingTag,
	parseMarkdownInline,
} from '../../../src/lib/markdown/markdownInlineHelpers.tsx';

describe('getMarkdownHeadingClass', () => {
	it('returns largest class for level 1', () => {
		expect(getMarkdownHeadingClass(1)).toBe('text-lg font-semibold');
	});

	it('returns medium class for level 2', () => {
		expect(getMarkdownHeadingClass(2)).toBe('text-base font-semibold');
	});

	it('returns small class for deeper levels', () => {
		expect(getMarkdownHeadingClass(3)).toBe('text-sm font-semibold');
	});
});

describe('getMarkdownHeadingTag', () => {
	it('maps level to heading tag capped at h6', () => {
		expect(getMarkdownHeadingTag(1)).toBe('h3');
		expect(getMarkdownHeadingTag(4)).toBe('h6');
	});
});

describe('parseMarkdownInline', () => {
	it('keeps plain text', () => {
		expect(parseMarkdownInline('hello', 'k')).toEqual(['hello']);
	});

	it('rejects unsafe javascript links as plain text', () => {
		expect(parseMarkdownInline('[x](javascript:alert)', 'k')).toEqual(['x']);
	});

	it('keeps https links', () => {
		const nodes = parseMarkdownInline('[docs](https://example.com)', 'k');
		expect(nodes).toHaveLength(1);
	});
});
