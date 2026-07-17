import { describe, expect, it } from 'bun:test';
import {
	resolveAgendaCancellationBannerProps,
	resolveAgendaDeviationBannerProps,
	resolveAgendaProjectSourceSelection,
	shouldShowAgendaProjectButton,
} from '../../../src/components/agenda/agendaEventFormDialogContentHelpers';

describe('resolveAgendaProjectSourceSelection', () => {
	it('selects project source when project id is set', () => {
		expect(resolveAgendaProjectSourceSelection('proj-1')).toEqual({
			selectedProjectId: 'proj-1',
			selectedSourceType: 'project',
		});
	});

	it('selects manual source when project id is cleared', () => {
		expect(resolveAgendaProjectSourceSelection(null)).toEqual({
			selectedProjectId: null,
			selectedSourceType: 'manual',
		});
	});
});

describe('shouldShowAgendaProjectButton', () => {
	it('returns true for privileged users', () => {
		expect(shouldShowAgendaProjectButton(true)).toBe(true);
	});

	it('returns false for non-privileged users', () => {
		expect(shouldShowAgendaProjectButton(false)).toBe(false);
	});
});

describe('resolveAgendaDeviationBannerProps', () => {
	it('returns deviation props when banner should render', () => {
		const deviationInfo = {
			deviationId: 'dev-1',
			originalDate: '2026-09-01',
			originalStartTime: '15:00',
			hasTimeOrDateChange: true,
		};
		expect(resolveAgendaDeviationBannerProps(true, true, deviationInfo)).toEqual({
			deviationInfo,
		});
	});

	it('returns null when revert is not allowed', () => {
		expect(
			resolveAgendaDeviationBannerProps(false, true, {
				deviationId: 'dev-1',
				originalDate: '2026-09-01',
				originalStartTime: '15:00',
				hasTimeOrDateChange: true,
			}),
		).toBeNull();
	});

	it('returns null when deviation info is missing', () => {
		expect(resolveAgendaDeviationBannerProps(true, true, null)).toBeNull();
	});
});

describe('resolveAgendaCancellationBannerProps', () => {
	it('returns cancellation props when banner should render', () => {
		expect(resolveAgendaCancellationBannerProps(true, 'lesson_cancelled')).toEqual({
			cancellationType: 'lesson_cancelled',
		});
	});

	it('returns null when event is not cancelled', () => {
		expect(resolveAgendaCancellationBannerProps(false, 'lesson_cancelled')).toBeNull();
	});

	it('returns null when cancellation type is missing', () => {
		expect(resolveAgendaCancellationBannerProps(true, null)).toBeNull();
	});
});
