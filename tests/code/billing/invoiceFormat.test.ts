import { describe, expect, it } from 'bun:test';
import { ageAtDate, bytesToBase64, fmtEUR, wrap } from '../../../supabase/functions/generate-invoice/format';

describe('ageAtDate', () => {
	it('returns unknown when date of birth is missing', () => {
		expect(ageAtDate(null, '2026-09-01')).toBe('unknown');
	});

	it('returns under_21 before the 21st birthday', () => {
		expect(ageAtDate('2010-05-01', '2026-09-01')).toBe('under_21');
	});

	it('returns 21_plus on or after the 21st birthday', () => {
		expect(ageAtDate('2005-09-01', '2026-09-01')).toBe('21_plus');
		expect(ageAtDate('2005-08-31', '2026-09-01')).toBe('21_plus');
	});
});

describe('fmtEUR', () => {
	it('formats cents as a Dutch euro string', () => {
		expect(fmtEUR(2420)).toBe('€ 24,20');
	});
});

describe('wrap', () => {
	it('splits long text into lines within the max width', () => {
		expect(wrap('one two three four five six', 10)).toEqual(['one two', 'three four', 'five six']);
	});

	it('returns a single line when text fits', () => {
		expect(wrap('short text', 50)).toEqual(['short text']);
	});
});

describe('bytesToBase64', () => {
	it('encodes bytes to base64', () => {
		expect(bytesToBase64(new Uint8Array([72, 105]))).toBe('SGk=');
	});
});
