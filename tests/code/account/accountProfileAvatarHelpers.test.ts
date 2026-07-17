import { describe, expect, it } from 'bun:test';
import { getAvatarUploadInputId, resolveAvatarImageSrc } from '../../../src/lib/account/accountProfileAvatarHelpers';

describe('resolveAvatarImageSrc', () => {
	it('returns undefined for empty avatar urls', () => {
		expect(resolveAvatarImageSrc(null)).toBeUndefined();
		expect(resolveAvatarImageSrc('')).toBeUndefined();
	});

	it('returns avatar url when present', () => {
		expect(resolveAvatarImageSrc('https://example.com/a.png')).toBe('https://example.com/a.png');
	});
});

describe('getAvatarUploadInputId', () => {
	it('returns stable upload input id', () => {
		expect(getAvatarUploadInputId()).toBe('avatar-upload');
	});
});
