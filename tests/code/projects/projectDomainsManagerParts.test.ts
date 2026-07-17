import { describe, expect, it } from 'bun:test';
import {
	shouldShowProjectDomainsEmpty,
	shouldShowProjectDomainsList,
	shouldShowProjectDomainsLoading,
} from '../../../src/components/projects/ProjectDomainsManagerParts';

describe('shouldShowProjectDomainsLoading', () => {
	it('returns true while loading', () => {
		expect(shouldShowProjectDomainsLoading(true)).toBe(true);
	});

	it('returns false when not loading', () => {
		expect(shouldShowProjectDomainsLoading(false)).toBe(false);
	});
});

describe('shouldShowProjectDomainsEmpty', () => {
	it('returns true when loaded with no domains', () => {
		expect(shouldShowProjectDomainsEmpty(false, 0)).toBe(true);
	});

	it('returns false while loading', () => {
		expect(shouldShowProjectDomainsEmpty(true, 0)).toBe(false);
	});
});

describe('shouldShowProjectDomainsList', () => {
	it('returns true when domains exist', () => {
		expect(shouldShowProjectDomainsList(false, 2)).toBe(true);
	});

	it('returns false while loading', () => {
		expect(shouldShowProjectDomainsList(true, 2)).toBe(false);
	});
});
