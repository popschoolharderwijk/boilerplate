import { describe, expect, it } from 'bun:test';
import {
	buildCancelConfirmPayload,
	canConfirmCancel,
	createInitialConfirmCancelState,
	getCancelStudentLabel,
	handleConfirmCancelSelection,
	isConfirmCancelTeacherDisabled,
	toggleCancelledParticipantId,
} from '../../../src/lib/agenda/confirmCancelDialogHelpers';

describe('confirmCancelDialogHelpers', () => {
	it('creates initial state for group lessons', () => {
		expect(createInitialConfirmCancelState(true, ['a'])).toEqual({
			cancellationType: 'student',
			selectedIds: ['a'],
			cancelAll: false,
		});
	});

	it('creates initial state for single lessons', () => {
		expect(createInitialConfirmCancelState(false, null)).toEqual({
			cancellationType: 'student',
			selectedIds: [],
			cancelAll: true,
		});
	});

	it('toggles participant ids', () => {
		expect(toggleCancelledParticipantId(['a'], 'a')).toEqual([]);
		expect(toggleCancelledParticipantId(['a'], 'b')).toEqual(['a', 'b']);
	});

	it('validates confirm availability', () => {
		expect(canConfirmCancel(false, true, [])).toBe(true);
		expect(canConfirmCancel(true, false, [])).toBe(false);
		expect(canConfirmCancel(true, false, ['a'])).toBe(true);
	});

	it('builds cancel payload for partial group cancel', () => {
		expect(buildCancelConfirmPayload(true, false, ['a'], 'student')).toEqual({
			cancellationType: 'student',
			cancelledParticipantIds: ['a'],
		});
	});

	it('builds cancel payload for full group cancel', () => {
		expect(buildCancelConfirmPayload(true, true, ['a'], 'teacher')).toEqual({
			cancellationType: 'teacher',
			cancelledParticipantIds: null,
		});
	});

	it('returns student label variants', () => {
		expect(getCancelStudentLabel(true, false)).toBe('Deelnemer(s) hebben afgezegd');
		expect(getCancelStudentLabel(false, true)).toBe('Leerling heeft afgezegd');
	});

	it('disables teacher cancel for partial group cancel', () => {
		expect(isConfirmCancelTeacherDisabled(true, false)).toBe(true);
		expect(isConfirmCancelTeacherDisabled(true, true)).toBe(false);
	});

	it('handles confirm selection', () => {
		const confirmed: Array<[string, string[] | null]> = [];
		handleConfirmCancelSelection(
			() => undefined,
			(cancellationType, cancelledParticipantIds) => {
				confirmed.push([cancellationType, cancelledParticipantIds]);
			},
			true,
			false,
			['student-1'],
			'student',
		);
		expect(confirmed).toEqual([['student', ['student-1']]]);
	});
});
