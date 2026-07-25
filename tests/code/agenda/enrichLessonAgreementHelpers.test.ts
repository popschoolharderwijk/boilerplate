import { describe, expect, it } from 'bun:test';
import type { EnrichAgendaEventContext } from '../../../src/lib/agenda/enrichAgendaEventContext';
import {
	buildLessonAgreementStudentInfo,
	buildLessonAgreementTeacherName,
} from '../../../src/lib/agenda/enrichLessonAgreementHelpers';
import type { AgendaLessonAgreement } from '../../../src/types/lesson-agreements';

const studentA = {
	user_id: 'stu-a',
	first_name: 'Anna',
	last_name: 'Bakker',
	email: 'anna@example.com',
	avatar_url: null,
	phone_number: null,
};

const studentB = {
	user_id: 'stu-b',
	first_name: 'Bram',
	last_name: 'Jansen',
	email: 'bram@example.com',
	avatar_url: null,
	phone_number: null,
};

const teacher = {
	user_id: 'tea-1',
	first_name: 'Piet',
	last_name: 'Docent',
	email: 'piet@example.com',
	avatar_url: null,
	phone_number: null,
};

function emptyContext(overrides: Partial<EnrichAgendaEventContext> = {}): EnrichAgendaEventContext {
	return {
		participantCountByEventId: new Map(),
		participantNamesByEventId: new Map(),
		participantUserIdsByEventId: new Map(),
		participantCountByDeviationId: new Map(),
		participantNamesByDeviationId: new Map(),
		projectsMap: new Map(),
		lessonGroupsMap: new Map(),
		agreementsMap: new Map(),
		deviationsByEventId: new Map(),
		profileMap: new Map(),
		viewerUserId: undefined,
		...overrides,
	};
}

const soloAgreement = {
	id: 'agr-1',
	student_user_id: 'stu-a',
	teacher_user_id: 'tea-1',
	profiles: studentA,
} as unknown as AgendaLessonAgreement;

describe('buildLessonAgreementStudentInfo', () => {
	it('builds solo student info from the agreement profile', () => {
		const result = buildLessonAgreementStudentInfo(soloAgreement, 'event-1', 'tea-1', emptyContext());
		expect(result.isDuo).toBe(false);
		expect(result.studentName).toBe('Anna Bakker');
		expect(result.studentUsers).toEqual([]);
		expect(result.user?.user_id).toBe('stu-a');
	});

	it('builds duo student info from event participants', () => {
		const ctx = emptyContext({
			participantUserIdsByEventId: new Map([['event-1', ['stu-a', 'stu-b', 'tea-1']]]),
			profileMap: new Map([
				['stu-a', studentA],
				['stu-b', studentB],
				['tea-1', teacher],
			]),
		});
		const result = buildLessonAgreementStudentInfo(soloAgreement, 'event-1', 'tea-1', ctx);
		expect(result.isDuo).toBe(true);
		expect(result.studentName).toBe('Anna Bakker & Bram Jansen');
		expect(result.studentUsers).toHaveLength(2);
		expect(result.user).toBeUndefined();
	});
});

describe('buildLessonAgreementTeacherName', () => {
	it('returns the teacher display name when profile exists', () => {
		expect(buildLessonAgreementTeacherName(teacher)).toBe('Piet Docent');
	});

	it('returns a fallback label when profile is missing', () => {
		expect(buildLessonAgreementTeacherName(null)).toBe('Docent onbekend');
	});
});
