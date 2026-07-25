import { describe, expect, it } from 'bun:test';
import {
	buildLegacyProfilePayload,
	resolveLegacyPersonCreated,
} from '../../../supabase/functions/_shared/legacyImportPure';

describe('resolveLegacyPersonCreated', () => {
	it('returns true when no existing user id is mapped', () => {
		expect(resolveLegacyPersonCreated(undefined)).toBe(true);
	});

	it('returns false when an existing user id is mapped', () => {
		expect(resolveLegacyPersonCreated('user-1')).toBe(false);
	});
});

describe('buildLegacyProfilePayload', () => {
	it('normalizes optional profile fields to null', () => {
		expect(buildLegacyProfilePayload('user-1', 'anna@example.com', 'Anna', 'Bakker', '0612345678')).toEqual({
			user_id: 'user-1',
			email: 'anna@example.com',
			first_name: 'Anna',
			last_name: 'Bakker',
			phone_number: '0612345678',
		});
	});

	it('uses null for missing optional fields', () => {
		expect(buildLegacyProfilePayload('user-2', 'bob@example.com', undefined, undefined, undefined)).toEqual({
			user_id: 'user-2',
			email: 'bob@example.com',
			first_name: null,
			last_name: null,
			phone_number: null,
		});
	});
});
