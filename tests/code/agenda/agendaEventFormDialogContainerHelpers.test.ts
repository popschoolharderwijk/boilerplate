import { describe, expect, it } from 'bun:test';
import {
	buildAgendaEventFormDialogContainerInput,
	resolveAgendaCancelLessonHandler,
	resolveAgendaEventOccurrenceDate,
} from '../../../src/components/agenda/agendaEventFormDialogContainerHelpers';

describe('resolveAgendaEventOccurrenceDate', () => {
	it('returns null when no event is selected', () => {
		expect(resolveAgendaEventOccurrenceDate(null)).toBeNull();
	});

	it('formats the selected event start date', () => {
		expect(resolveAgendaEventOccurrenceDate({ start: new Date('2026-07-17T10:00:00.000Z') } as never)).toBe(
			'2026-07-17',
		);
	});

	it('returns null when selected event has no start date', () => {
		expect(resolveAgendaEventOccurrenceDate({} as never)).toBeNull();
	});
});

describe('resolveAgendaCancelLessonHandler', () => {
	it('returns undefined when cancel is not allowed', () => {
		expect(
			resolveAgendaCancelLessonHandler({ isCancelled: false }, true, true, async () => undefined),
		).toBeUndefined();
	});

	it('returns the cancel handler when event is cancelled and user can edit', () => {
		const cancel = async () => undefined;
		expect(resolveAgendaCancelLessonHandler({ isCancelled: true }, true, true, cancel)).toBe(cancel);
	});
});

describe('buildAgendaEventFormDialogContainerInput', () => {
	it('returns the container input unchanged', () => {
		const ui = { formDialogOpen: true } as never;
		const derived = { occurrenceParticipantIds: ['a'] } as never;
		const reloadAgenda = () => undefined;
		const handleCancelLesson = async () => undefined;
		expect(
			buildAgendaEventFormDialogContainerInput(ui, derived, true, false, reloadAgenda, handleCancelLesson),
		).toEqual({
			ui,
			derived,
			canEdit: true,
			canManageAgenda: false,
			reloadAgenda,
			handleCancelLesson,
		});
	});
});
