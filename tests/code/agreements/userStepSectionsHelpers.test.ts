import { describe, expect, it } from 'bun:test';
import { hasDuplicateDuoPartner, mapSelectedUserIds } from '../../../src/lib/agreements/userStepSectionsHelpers';

describe('hasDuplicateDuoPartner', () => {
	it('returns true when the partner matches the selected student', () => {
		expect(
			hasDuplicateDuoPartner('student-1', 'student-1', {
				user_id: 'student-1',
				email: 'jan@example.com',
				first_name: 'Jan',
				last_name: 'Jansen',
				avatar_url: null,
				phone_number: null,
			}),
		).toBe(true);
	});

	it('returns false when the partner differs from the selected student', () => {
		expect(hasDuplicateDuoPartner('student-2', 'student-1', null)).toBe(false);
	});
});

describe('mapSelectedUserIds', () => {
	it('maps a selected user to ids and user object', () => {
		const user = {
			user_id: 'student-1',
			email: 'jan@example.com',
			first_name: 'Jan',
			last_name: 'Jansen',
			avatar_url: null,
			phone_number: null,
		};
		expect(mapSelectedUserIds(user)).toEqual({ userId: 'student-1', user });
	});

	it('maps a missing user to null values', () => {
		expect(mapSelectedUserIds(null)).toEqual({ userId: null, user: null });
	});
});
