import { describe, expect, it } from 'bun:test';
import {
	buildTeacherSlotButtonTitle,
	getTeacherSlotButtonClass,
	getTeacherSlotStatusTitle,
	isCurrentAgreementTeacherSlot,
	isTeacherSlotSelected,
} from '../../../src/components/agreements/teacherSlotButtonHelpers';

describe('teacherSlotButtonHelpers', () => {
	it('detects selected slots', () => {
		expect(
			isTeacherSlotSelected(
				{ day_of_week: 1, start_time: '10:00:00' },
				{ day_of_week: 1, start_time: '10:00:00' },
			),
		).toBe(true);
		expect(
			isTeacherSlotSelected(
				{ day_of_week: 1, start_time: '10:00:00' },
				{ day_of_week: 2, start_time: '10:00:00' },
			),
		).toBe(false);
	});

	it('detects current agreement slots ignoring seconds formatting', () => {
		expect(
			isCurrentAgreementTeacherSlot(
				{ day_of_week: 1, start_time: '10:00:00' },
				{ day_of_week: 1, start_time: '10:00' },
			),
		).toBe(true);
		expect(isCurrentAgreementTeacherSlot(null, { day_of_week: 1, start_time: '10:00' })).toBe(false);
	});

	it('builds status titles', () => {
		expect(getTeacherSlotStatusTitle({ status: 'partial', occupiedOccurrences: 1, totalOccurrences: 4 })).toBe(
			'Deels bezet (1/4 momenten)',
		);
		expect(getTeacherSlotStatusTitle({ status: 'free', occupiedOccurrences: 0, totalOccurrences: 4 })).toBe('Vrij');
		expect(getTeacherSlotStatusTitle({ status: 'occupied', occupiedOccurrences: 4, totalOccurrences: 4 })).toBe(
			'Bezet',
		);
	});

	it('builds button titles', () => {
		expect(
			buildTeacherSlotButtonTitle(
				{ status: 'partial', occupiedOccurrences: 1, totalOccurrences: 4 },
				true,
				'Deels bezet',
			),
		).toBe('Huidige slot van deze overeenkomst. Deels bezet (1/4)');
	});

	it('builds button classes for free selected slots', () => {
		const classes = getTeacherSlotButtonClass({
			isOccupied: false,
			isSelected: true,
			isCurrentAgreementSlot: false,
			status: 'free',
		});
		expect(classes.includes('ring-2 ring-primary')).toBe(true);
		expect(classes.includes('border-green-200 dark:border-green-800')).toBe(true);
	});
});
