import { describe, expect, it } from 'bun:test';
import {
	resolveTeacherProfileSaveErrorLabel,
	runTeacherProfileSave,
} from '../../../src/lib/teachers/teacherProfileSaveActionHelpers';

const form = {
	bio: 'Bio',
	firstName: 'Jan',
	lastName: 'Jansen',
	phoneNumber: '0612345678',
	hasVog: true,
	vogExpiresAt: '2027-01-01',
};

describe('resolveTeacherProfileSaveErrorLabel', () => {
	it('returns bio label for bio errors', () => {
		expect(resolveTeacherProfileSaveErrorLabel('bio')).toBe('bio');
	});

	it('returns profiel label for profile errors', () => {
		expect(resolveTeacherProfileSaveErrorLabel('profile')).toBe('profiel');
	});
});

describe('runTeacherProfileSave', () => {
	it('returns saved false when user cannot save', async () => {
		const result = await runTeacherProfileSave({
			supabase: {} as never,
			teacherUserId: 'teacher-1',
			userId: 'user-1',
			canEdit: false,
			hasUser: true,
			form,
		});
		expect(result).toEqual({ saved: false });
	});
});
