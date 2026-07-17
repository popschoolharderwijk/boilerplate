import { describe, expect, it } from 'bun:test';
import {
	isStudentEmailFieldDisabled,
	isStudentPersonalNameFieldDisabled,
} from '../../../src/lib/students/studentFormPersonalSectionHelpers';

describe('isStudentPersonalNameFieldDisabled', () => {
	it('disables name fields when editing an existing-user student', () => {
		expect(isStudentPersonalNameFieldDisabled(true, 'existing-user')).toBe(true);
	});

	it('keeps name fields enabled when creating a new user', () => {
		expect(isStudentPersonalNameFieldDisabled(false, 'new-user')).toBe(false);
	});
});

describe('isStudentEmailFieldDisabled', () => {
	it('disables email in edit mode', () => {
		expect(isStudentEmailFieldDisabled(true, 'new-user')).toBe(true);
	});

	it('disables email when linking an existing user', () => {
		expect(isStudentEmailFieldDisabled(false, 'existing-user')).toBe(true);
	});

	it('keeps email enabled for a new user in create mode', () => {
		expect(isStudentEmailFieldDisabled(false, 'new-user')).toBe(false);
	});
});
