import { describe, expect, it } from 'bun:test';
import {
	formatAgreementCount,
	formatAgreementListCount,
	formatSignupRequestCount,
	getAgreementIds,
	getStudentActiveStatusLabel,
} from '../../../src/lib/students/studentsPageHelpers';

describe('studentsPageHelpers', () => {
	it('formats agreement count labels', () => {
		expect(formatAgreementCount(1)).toBe('1 lesovereenkomst');
		expect(formatAgreementCount(2)).toBe('2 lesovereenkomsten');
		expect(formatAgreementListCount(1)).toBe('1 overeenkomst');
		expect(formatAgreementListCount(3)).toBe('3 overeenkomsten');
	});

	it('formats signup request count labels', () => {
		expect(formatSignupRequestCount(1)).toBe('1 aanmelding');
		expect(formatSignupRequestCount(4)).toBe('4 aanmeldingen');
	});

	it('returns active status label', () => {
		expect(getStudentActiveStatusLabel(1)).toBe('Actief');
		expect(getStudentActiveStatusLabel(0)).toBe('Inactief');
	});

	it('collects agreement ids', () => {
		expect(
			getAgreementIds({
				agreements: [{ id: 'a-1' }, { id: 'a-2' }],
			} as never),
		).toEqual(['a-1', 'a-2']);
	});
});
