import { describe, expect, it } from 'bun:test';
import {
	wizardDefaultEndDate,
	wizardDefaultStartDate,
} from '../../../src/components/agreements/wizard/wizardDateDefaults';
import { addDaysFromNow, addYearsFromNow, formatDateToDb } from '../../../src/lib/date/date-format';

describe('wizardDateDefaults', () => {
	it('uses tomorrow as the default start date', () => {
		expect(wizardDefaultStartDate()).toBe(formatDateToDb(addDaysFromNow(1)));
	});

	it('uses one year from now as the default end date', () => {
		expect(wizardDefaultEndDate()).toBe(formatDateToDb(addYearsFromNow(1)));
	});

	it('returns database-formatted date strings', () => {
		expect(wizardDefaultStartDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(wizardDefaultEndDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});
