import { describe, expect, it } from 'bun:test';
import {
	buildParticipantProfileMap,
	extractParticipantUserIds,
	shouldClearParticipantProfiles,
	shouldUseOccurrenceParticipantIds,
} from '../../../src/components/agenda/agendaEventParticipantStateHelpers';

describe('extractParticipantUserIds', () => {
	it('extracts participant user ids', () => {
		expect(extractParticipantUserIds([{ user_id: 'user-1' }, { user_id: 'user-2' }])).toEqual(['user-1', 'user-2']);
	});
});

describe('buildParticipantProfileMap', () => {
	it('maps profile rows by user id', () => {
		expect(
			buildParticipantProfileMap([
				{
					user_id: 'user-1',
					first_name: 'Anna',
					last_name: 'Bakker',
					email: 'anna@example.com',
				},
				{
					user_id: 'user-2',
					first_name: null,
					last_name: 'Jansen',
					email: 'jan@example.com',
				},
			]),
		).toEqual({
			'user-1': {
				first_name: 'Anna',
				last_name: 'Bakker',
				email: 'anna@example.com',
			},
			'user-2': {
				first_name: null,
				last_name: 'Jansen',
				email: 'jan@example.com',
			},
		});
	});

	it('returns an empty map for null or empty input', () => {
		expect(buildParticipantProfileMap(null)).toEqual({});
		expect(buildParticipantProfileMap([])).toEqual({});
	});
});

describe('shouldUseOccurrenceParticipantIds', () => {
	it('returns true for non-empty participant id lists', () => {
		expect(shouldUseOccurrenceParticipantIds(['user-1'])).toBe(true);
	});

	it('returns false for empty or missing lists', () => {
		expect(shouldUseOccurrenceParticipantIds([])).toBe(false);
		expect(shouldUseOccurrenceParticipantIds(null)).toBe(false);
	});
});

describe('shouldClearParticipantProfiles', () => {
	it('clears profiles when dialog is closed or list is empty', () => {
		expect(shouldClearParticipantProfiles(false, 2)).toBe(true);
		expect(shouldClearParticipantProfiles(true, 0)).toBe(true);
	});

	it('keeps profiles when dialog is open with participants', () => {
		expect(shouldClearParticipantProfiles(true, 2)).toBe(false);
	});
});
