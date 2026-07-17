import { describe, expect, it } from 'bun:test';
import {
	getAvatarUploadInputId,
	resolveAvatarImageSrc,
	shouldShowAvatarDeleteButton,
} from '../../../src/lib/account/accountProfileAvatarHelpers';

describe('resolveAvatarImageSrc', () => {
	it('returns undefined for empty avatar urls', () => {
		expect(resolveAvatarImageSrc(null)).toBeUndefined();
		expect(resolveAvatarImageSrc('')).toBeUndefined();
	});

	it('returns avatar url when present', () => {
		expect(resolveAvatarImageSrc('https://example.com/a.png')).toBe('https://example.com/a.png');
	});
});

describe('shouldShowAvatarDeleteButton', () => {
	it('returns false without avatar url', () => {
		expect(shouldShowAvatarDeleteButton(null)).toBe(false);
	});

	it('returns true with avatar url', () => {
		expect(shouldShowAvatarDeleteButton('https://example.com/a.png')).toBe(true);
	});
});

describe('getAvatarUploadInputId', () => {
	it('returns stable upload input id', () => {
		expect(getAvatarUploadInputId()).toBe('avatar-upload');
	});
});
