import { describe, expect, it } from 'bun:test';
import {
	buildTrialLessonConvertSearchParams,
	getTrialStatusBadgeVariant,
	showTrialAgreementButton,
	showTrialCancelButton,
	showTrialGivenButton,
} from '../../../src/lib/trial-lessons/trialLessonsPageHelpers';

describe('getTrialStatusBadgeVariant', () => {
	it('returns default for student confirmed status', () => {
		expect(getTrialStatusBadgeVariant('student_confirmed')).toBe('default');
	});

	it('returns outline for declined or cancelled status', () => {
		expect(getTrialStatusBadgeVariant('student_declined')).toBe('outline');
		expect(getTrialStatusBadgeVariant('cancelled')).toBe('outline');
	});

	it('returns secondary for other statuses', () => {
		expect(getTrialStatusBadgeVariant('scheduled')).toBe('secondary');
	});
});

describe('trial lesson action visibility', () => {
	it('shows given button only for scheduled trials', () => {
		expect(showTrialGivenButton('scheduled')).toBe(true);
		expect(showTrialGivenButton('completed')).toBe(false);
	});

	it('shows agreement button only for student confirmed trials', () => {
		expect(showTrialAgreementButton('student_confirmed')).toBe(true);
		expect(showTrialAgreementButton('scheduled')).toBe(false);
	});

	it('shows cancel button for scheduled and completed trials', () => {
		expect(showTrialCancelButton('scheduled')).toBe(true);
		expect(showTrialCancelButton('completed')).toBe(true);
		expect(showTrialCancelButton('student_confirmed')).toBe(false);
	});
});

describe('buildTrialLessonConvertSearchParams', () => {
	it('includes option id when present', () => {
		expect(
			buildTrialLessonConvertSearchParams({
				fromTrial: 'trial-1',
				studentUserId: 'student-1',
				lessonTypeId: 'lesson-type-1',
				optionId: 'option-1',
			}).toString(),
		).toBe('fromTrial=trial-1&studentUserId=student-1&lessonTypeId=lesson-type-1&optionId=option-1');
	});

	it('omits option id when absent', () => {
		expect(
			buildTrialLessonConvertSearchParams({
				fromTrial: 'trial-1',
				studentUserId: 'student-1',
				lessonTypeId: 'lesson-type-1',
			}).toString(),
		).toBe('fromTrial=trial-1&studentUserId=student-1&lessonTypeId=lesson-type-1');
	});
});
