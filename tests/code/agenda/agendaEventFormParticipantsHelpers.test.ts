import { describe, expect, it } from 'bun:test';
import { resolveParticipantBadgeState } from '../../../src/lib/agenda/agendaEventFormParticipantsHelpers';

describe('resolveParticipantBadgeState', () => {
	it('marks the current user as self label', () => {
		expect(
			resolveParticipantBadgeState({
				id: 'user-1',
				currentUserId: 'user-1',
				effectiveOwnerId: 'owner-1',
				profile: { first_name: 'Jan', last_name: 'Jansen', email: 'jan@example.com' },
				readonlyParticipantIds: [],
				isCancelledEvent: false,
				displayName: 'Jan Jansen',
			}),
		).toEqual({
			label: 'Jij',
			isOwner: false,
			isLessonParticipant: false,
			canRemove: true,
			useSelfLabel: true,
		});
	});

	it('marks readonly lesson participants', () => {
		expect(
			resolveParticipantBadgeState({
				id: 'student-1',
				currentUserId: 'user-1',
				effectiveOwnerId: 'owner-1',
				profile: { first_name: 'Piet', last_name: 'Pietersen', email: 'piet@example.com' },
				readonlyParticipantIds: ['student-1'],
				isCancelledEvent: false,
				displayName: 'Piet Pietersen',
			}),
		).toEqual({
			label: 'Piet Pietersen',
			isOwner: false,
			isLessonParticipant: true,
			canRemove: false,
			useSelfLabel: false,
		});
	});
});
