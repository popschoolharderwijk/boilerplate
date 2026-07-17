import { describe, expect, it } from 'bun:test';
import { getStudentFormDialogCopy } from '../../../src/components/students/studentFormDialogCopy';

describe('getStudentFormDialogCopy', () => {
	it('returns create labels for new students', () => {
		expect(getStudentFormDialogCopy(false, '', '')).toEqual({
			dialogTitle: 'Nieuwe leerling toevoegen',
			dialogDescription: 'Voeg een nieuwe leerling toe aan het systeem.',
			submitLabel: 'Toevoegen',
			savingLabel: 'Toevoegen...',
		});
	});

	it('returns edit labels with first name in description', () => {
		expect(getStudentFormDialogCopy(true, 'Anna', 'anna@example.com')).toEqual({
			dialogTitle: 'Leerling bewerken',
			dialogDescription: 'Wijzig de gegevens van Anna.',
			submitLabel: 'Opslaan',
			savingLabel: 'Opslaan...',
		});
	});

	it('falls back to email in edit description when first name is empty', () => {
		expect(getStudentFormDialogCopy(true, '', 'anna@example.com').dialogDescription).toBe(
			'Wijzig de gegevens van anna@example.com.',
		);
	});
});
