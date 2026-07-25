import { describe, expect, it } from 'bun:test';
import { parseChangelog } from '../../../src/lib/changelog/parse-changelog';

describe('parseChangelog', () => {
	it('parses version sections with dates and bullet items', () => {
		const markdown = `# Changelog

## 0.2.0 — 2026-07-25

- First change with **bold** text
- Second change

## 0.1.0 — 2026-07-01

- Initial release
`;

		expect(parseChangelog(markdown)).toEqual([
			{
				version: '0.2.0',
				date: '2026-07-25',
				items: ['First change with **bold** text', 'Second change'],
			},
			{
				version: '0.1.0',
				date: '2026-07-01',
				items: ['Initial release'],
			},
		]);
	});

	it('parses version sections without dates', () => {
		const markdown = `## 1.0.0

- Ship it
`;

		expect(parseChangelog(markdown)).toEqual([
			{
				version: '1.0.0',
				date: undefined,
				items: ['Ship it'],
			},
		]);
	});

	it('returns an empty array when there are no sections', () => {
		expect(parseChangelog('# Changelog\n\nNo sections yet.\n')).toEqual([]);
	});
});
