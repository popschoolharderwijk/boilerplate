import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { NavigateFunction } from 'react-router-dom';
import type { SlotWithStatus } from '../../../src/lib/agreementSlots';
import type {
	ValidatedDuoSaveForm,
	ValidatedWizardSaveForm,
	WizardSaveForm,
} from '../../../src/lib/agreements/wizardSaveHelpers';
import type { AgreementTableRow } from '../../../src/types/lesson-agreements';

const toastMessages: { type: 'error' | 'success' | 'warning'; message: string }[] = [];

mock.module('sonner', () => ({
	toast: {
		error: (message: string) => {
			toastMessages.push({ type: 'error', message });
		},
		success: (message: string) => {
			toastMessages.push({ type: 'success', message });
		},
		warning: (message: string) => {
			toastMessages.push({ type: 'warning', message });
		},
	},
}));

type TableResult = { data?: unknown; error?: { message: string } | null };

const recordedCalls: { table: string; op: 'insert' | 'update'; payload: unknown; filters: Record<string, unknown> }[] =
	[];
let tableResults: Record<string, TableResult> = {};

function thenableResult(result: TableResult) {
	const promise = Promise.resolve(result);
	return Object.assign(promise, {
		eq: () => thenableResult(result),
		select: () => thenableResult(result),
		single: () => promise,
		maybeSingle: () => promise,
	});
}

function buildUpdateChain(table: string, payload: unknown) {
	const filters: Record<string, unknown> = {};
	return {
		eq: (col: string, val: unknown) => {
			filters[col] = val;
			recordedCalls.push({ table, op: 'update', payload, filters });
			return thenableResult(tableResults[`${table}:update`] ?? { data: { id: 'agr-1' }, error: null });
		},
	};
}

const supabaseMock = {
	from: (table: string) => ({
		update: (payload: unknown) => buildUpdateChain(table, payload),
		insert: (payload: unknown) => ({
			select: () => ({
				single: () => {
					recordedCalls.push({ table, op: 'insert', payload, filters: {} });
					return Promise.resolve(tableResults[`${table}:insert`] ?? { data: { id: 'agr-new' }, error: null });
				},
			}),
		}),
	}),
	functions: {
		invoke: (fn: string, body?: { body?: unknown }) => {
			recordedCalls.push({ table: fn, op: 'insert', payload: body?.body ?? null, filters: {} });
			const key = fn === 'create-duo-agreements' ? 'create-duo-agreements' : 'send-incasso-invite';
			return Promise.resolve(tableResults[key] ?? { data: null, error: null });
		},
	},
};

mock.module('../../../src/integrations/supabase/client', () => ({
	supabase: supabaseMock,
}));

mock.module('../../../src/lib/email/sendAgreementCreatedMails', () => ({
	sendAgreementCreatedMails: async () => {},
}));

function freeSlot(overrides: Partial<SlotWithStatus> = {}): SlotWithStatus {
	return {
		day_of_week: 1,
		start_time: '09:00',
		end_time: '10:00',
		status: 'free',
		totalOccurrences: 10,
		occupiedOccurrences: 0,
		...overrides,
	};
}

function baseForm(overrides: Partial<WizardSaveForm> = {}): WizardSaveForm {
	return {
		studentUserId: 'stu-1',
		lessonTypeId: 'lt-1',
		teacherUserId: 'tea-1',
		slot: freeSlot(),
		partnerStudentUserId: null,
		selectedOptionSnapshot: null,
		startDate: '2026-09-01',
		endDate: '2027-07-31',
		paymentMethod: 'stripe',
		sepaMandateId: null,
		...overrides,
	};
}

function mockAgreementRow(overrides: Partial<AgreementTableRow> = {}): AgreementTableRow {
	return {
		id: 'agr-1',
		day_of_week: 1,
		start_time: '09:00',
		start_date: '2026-09-01',
		end_date: null,
		is_active: true,
		student_user_id: 'stu-1',
		lesson_type_id: 'lt-1',
		duration_minutes: 60,
		frequency: 'weekly',
		price_per_lesson: 30,
		created_at: '2026-01-01T00:00:00Z',
		notes: null,
		payment_method: 'stripe',
		sepa_mandate_id: null,
		teacher_user_id: 'tea-1',
		student: {
			first_name: 'Jan',
			last_name: 'Jansen',
			avatar_url: null,
			email: 'jan@example.com',
		},
		teacher: {
			first_name: 'Piet',
			last_name: 'Docent',
			avatar_url: null,
			email: 'piet@example.com',
		},
		lesson_type: { id: 'lt-1', name: 'Piano', icon: 'piano', color: '#000000' },
		...overrides,
	};
}

describe('wizardSaveHelpers validation', () => {
	let helpers: typeof import('../../../src/lib/agreements/wizardSaveHelpers');

	beforeAll(async () => {
		helpers = await import('../../../src/lib/agreements/wizardSaveHelpers');
	});

	beforeEach(() => {
		toastMessages.length = 0;
		recordedCalls.length = 0;
		tableResults = {};
	});

	it('normalizes slot start time without a colon', () => {
		expect(helpers.normalizeSlotStartTime('0900')).toBe('0900:00');
	});

	it('keeps slot start time that already includes seconds', () => {
		expect(helpers.normalizeSlotStartTime('09:00:00')).toBe('09:00:00');
	});

	it('rejects save when required fields are missing', () => {
		const result = helpers.validateRequiredSaveFields(baseForm({ studentUserId: null }));
		expect(result).toBe(false);
		expect(toastMessages).toEqual([{ type: 'error', message: 'Selecteer alle verplichte velden' }]);
	});

	it('rejects save when the selected slot is occupied', () => {
		const result = helpers.validateRequiredSaveFields(baseForm({ slot: freeSlot({ status: 'occupied' }) }));
		expect(result).toBe(false);
		expect(toastMessages).toEqual([{ type: 'error', message: 'Selecteer alle verplichte velden' }]);
	});

	it('accepts save when all required fields are present', () => {
		const form = baseForm();
		const result = helpers.validateRequiredSaveFields(form);
		expect(result).toBe(true);
		expect(toastMessages).toHaveLength(0);
	});

	it('rejects duo save when partner equals the student', () => {
		const form = baseForm({ partnerStudentUserId: 'stu-1' });
		const validated = helpers.validateRequiredSaveFields(form);
		expect(validated).toBe(true);
		const duoResult = helpers.validateDuoSaveForm(form as ValidatedWizardSaveForm);
		expect(duoResult).toBe(false);
		expect(toastMessages).toEqual([{ type: 'error', message: 'Kies een duo-partner (verschillende leerling)' }]);
	});

	it('rejects duo save when no lesson option is selected', () => {
		const form = baseForm({ partnerStudentUserId: 'stu-2', selectedOptionSnapshot: null });
		const validated = helpers.validateRequiredSaveFields(form);
		expect(validated).toBe(true);
		const duoResult = helpers.validateDuoSaveForm(form as ValidatedWizardSaveForm);
		expect(duoResult).toBe(false);
		expect(toastMessages).toEqual([{ type: 'error', message: 'Selecteer een lesoptie' }]);
	});

	it('accepts duo save when partner and option are valid', () => {
		const form = baseForm({
			partnerStudentUserId: 'stu-2',
			selectedOptionSnapshot: { duration_minutes: 45, frequency: 'weekly', price_per_lesson: 25 },
		});
		const validated = helpers.validateRequiredSaveFields(form);
		expect(validated).toBe(true);
		const duoResult = helpers.validateDuoSaveForm(form as ValidatedWizardSaveForm);
		expect(duoResult).toBe(true);
		expect(toastMessages).toHaveLength(0);
	});

	it('rejects sepa save without a mandate id', () => {
		const result = helpers.validateSepaMandate(baseForm({ paymentMethod: 'sepa', sepaMandateId: null }));
		expect(result).toBe(false);
		expect(toastMessages).toEqual([
			{ type: 'error', message: 'Kies een SEPA-mandaat of een andere betaalmethode' },
		]);
	});

	it('accepts stripe payment without a sepa mandate', () => {
		const result = helpers.validateSepaMandate(baseForm({ paymentMethod: 'stripe' }));
		expect(result).toBe(true);
		expect(toastMessages).toHaveLength(0);
	});

	it('builds the agreement upsert payload with sepa mandate', () => {
		const form = baseForm({ paymentMethod: 'sepa', sepaMandateId: 'mandate-1' });
		const validated = helpers.validateRequiredSaveFields(form);
		expect(validated).toBe(true);
		const payload = helpers.buildAgreementUpsertPayload(form as ValidatedWizardSaveForm, '09:00:00');
		expect(payload).toEqual({
			teacher_user_id: 'tea-1',
			day_of_week: 1,
			start_time: '09:00:00',
			start_date: '2026-09-01',
			end_date: '2027-07-31',
			payment_method: 'sepa',
			sepa_mandate_id: 'mandate-1',
		});
	});

	it('returns signup requests path when saving from a request', () => {
		expect(helpers.getAgreementSavedNavigatePath('req-1', null)).toBe('/aanmeldingen');
	});

	it('returns trial lessons path when saving from a trial lesson', () => {
		expect(helpers.getAgreementSavedNavigatePath(null, 'trial-1')).toBe('/trial-lessons');
	});

	it('returns agreements path for a regular save', () => {
		expect(helpers.getAgreementSavedNavigatePath(null, null)).toBe('/agreements');
	});

	it('shows the sepa toast for a new agreement', () => {
		helpers.showAgreementSavedToast({ isEdit: false, isNew: true, paymentMethod: 'sepa' });
		expect(toastMessages).toEqual([
			{ type: 'success', message: 'Overeenkomst toegevoegd — SEPA-incasso gekoppeld' },
		]);
	});

	it('shows the edit toast for an updated agreement', () => {
		helpers.showAgreementSavedToast({ isEdit: true, isNew: false, paymentMethod: 'stripe' });
		expect(toastMessages).toEqual([{ type: 'success', message: 'Overeenkomst bijgewerkt' }]);
	});
});

describe('upsertWizardAgreement', () => {
	let upsertWizardAgreement: typeof import('../../../src/lib/agreements/wizardSaveHelpers').upsertWizardAgreement;
	let buildAgreementUpsertPayload: typeof import('../../../src/lib/agreements/wizardSaveHelpers').buildAgreementUpsertPayload;
	let validateRequiredSaveFields: typeof import('../../../src/lib/agreements/wizardSaveHelpers').validateRequiredSaveFields;

	beforeAll(async () => {
		({ upsertWizardAgreement, buildAgreementUpsertPayload, validateRequiredSaveFields } = await import(
			'../../../src/lib/agreements/wizardSaveHelpers'
		));
	});

	beforeEach(() => {
		recordedCalls.length = 0;
		tableResults = {};
	});

	it('inserts a new agreement when no existing row is provided', async () => {
		const form = baseForm();
		expect(validateRequiredSaveFields(form)).toBe(true);
		const payload = buildAgreementUpsertPayload(form as ValidatedWizardSaveForm, '09:00:00');
		const result = await upsertWizardAgreement(null, form as ValidatedWizardSaveForm, payload, null);
		expect(result.error).toBeNull();
		expect(result.data).toEqual({ id: 'agr-new' });
		expect(recordedCalls).toHaveLength(1);
		expect(recordedCalls[0]?.op).toBe('insert');
	});

	it('updates an existing agreement when a row is provided', async () => {
		const form = baseForm();
		expect(validateRequiredSaveFields(form)).toBe(true);
		const payload = buildAgreementUpsertPayload(form as ValidatedWizardSaveForm, '09:00:00');
		const result = await upsertWizardAgreement(mockAgreementRow(), form as ValidatedWizardSaveForm, payload, null);
		expect(result.error).toBeNull();
		expect(result.data).toEqual({ id: 'agr-1' });
		expect(recordedCalls).toHaveLength(1);
		expect(recordedCalls[0]).toEqual({
			table: 'lesson_agreements',
			op: 'update',
			payload,
			filters: { id: 'agr-1' },
		});
	});
});

function validatedDuoForm(overrides: Partial<WizardSaveForm> = {}): ValidatedDuoSaveForm {
	return baseForm({
		partnerStudentUserId: 'stu-2',
		selectedOptionSnapshot: { duration_minutes: 45, frequency: 'weekly', price_per_lesson: 25 },
		...overrides,
	}) as ValidatedDuoSaveForm;
}

describe('createAndNotifyDuoAgreements', () => {
	let createAndNotifyDuoAgreements: typeof import('../../../src/lib/agreements/wizardSaveHelpers').createAndNotifyDuoAgreements;
	const navigateCalls: string[] = [];
	const recordNavigate: NavigateFunction = (path) => {
		navigateCalls.push(String(path));
	};

	beforeAll(async () => {
		({ createAndNotifyDuoAgreements } = await import('../../../src/lib/agreements/wizardSaveHelpers'));
	});

	beforeEach(() => {
		toastMessages.length = 0;
		recordedCalls.length = 0;
		tableResults = {};
		navigateCalls.length = 0;
		tableResults['create-duo-agreements'] = {
			data: { agreement_ids: ['agr-1', 'agr-2'], duo_pair_id: 'pair-1' },
			error: null,
		};
		tableResults['send-incasso-invite'] = { data: null, error: null };
	});

	it('returns false when duo agreements cannot be created', async () => {
		tableResults['create-duo-agreements'] = { data: null, error: { message: 'duo failed' } };
		const result = await createAndNotifyDuoAgreements({
			form: validatedDuoForm(),
			fromRequestId: null,
			navigate: recordNavigate,
		});
		expect(result).toBe(false);
		expect(toastMessages).toEqual([{ type: 'error', message: 'duo failed' }]);
		expect(navigateCalls).toHaveLength(0);
	});

	it('navigates to agreements after successful duo save', async () => {
		const result = await createAndNotifyDuoAgreements({
			form: validatedDuoForm(),
			fromRequestId: 'req-1',
			navigate: recordNavigate,
		});
		expect(result).toBe(true);
		expect(navigateCalls).toEqual(['/agreements']);
		expect(toastMessages).toEqual([
			{ type: 'success', message: 'Duo-overeenkomsten toegevoegd — betaaluitnodigingen verstuurd' },
		]);
		expect(recordedCalls[0]?.payload).toEqual({
			student_user_id_a: 'stu-1',
			student_user_id_b: 'stu-2',
			teacher_user_id: 'tea-1',
			lesson_type_id: 'lt-1',
			day_of_week: 1,
			start_time: '09:00',
			duration_minutes: 45,
			frequency: 'weekly',
			price_per_lesson: 25,
			start_date: '2026-09-01',
			end_date: '2027-07-31',
			signup_source: 'public_form',
		});
	});

	it('shows warning toast when an invite fails', async () => {
		tableResults['send-incasso-invite'] = { data: null, error: { message: 'invite failed' } };
		const result = await createAndNotifyDuoAgreements({
			form: validatedDuoForm(),
			fromRequestId: null,
			navigate: recordNavigate,
		});
		expect(result).toBe(true);
		expect(toastMessages).toEqual([
			{
				type: 'warning',
				message: 'Duo-overeenkomsten opgeslagen, maar 2 betaaluitnodiging(en) konden niet worden verstuurd',
			},
		]);
	});
});

describe('resolveWizardAgreementUpsertErrorMessage', () => {
	let resolveWizardAgreementUpsertErrorMessage: typeof import('../../../src/lib/agreements/wizardSaveHelpers').resolveWizardAgreementUpsertErrorMessage;

	beforeAll(async () => {
		({ resolveWizardAgreementUpsertErrorMessage } = await import('../../../src/lib/agreements/wizardSaveHelpers'));
	});

	it('returns the unique constraint message', () => {
		expect(resolveWizardAgreementUpsertErrorMessage('duplicate key unique violation')).toBe(
			'Deze combinatie bestaat al',
		);
	});

	it('returns the generic save error message', () => {
		expect(resolveWizardAgreementUpsertErrorMessage('db failed')).toBe('Fout bij opslagen');
	});
});

describe('saveWizardAgreement', () => {
	let saveWizardAgreement: typeof import('../../../src/lib/agreements/wizardSaveHelpers').saveWizardAgreement;
	const navigateCalls: string[] = [];
	const recordNavigate: NavigateFunction = (path) => {
		navigateCalls.push(String(path));
	};

	beforeAll(async () => {
		({ saveWizardAgreement } = await import('../../../src/lib/agreements/wizardSaveHelpers'));
	});

	beforeEach(() => {
		toastMessages.length = 0;
		recordedCalls.length = 0;
		tableResults = {};
		navigateCalls.length = 0;
	});

	it('returns false when required fields are missing', async () => {
		const result = await saveWizardAgreement({
			form: baseForm({ studentUserId: null }),
			agreement: null,
			isDuoLesson: false,
			fromRequestId: null,
			fromTrialId: null,
			navigate: recordNavigate,
		});
		expect(result).toBe(false);
		expect(navigateCalls).toHaveLength(0);
	});

	it('saves a new agreement and navigates to agreements', async () => {
		const result = await saveWizardAgreement({
			form: baseForm(),
			agreement: null,
			isDuoLesson: false,
			fromRequestId: null,
			fromTrialId: null,
			navigate: recordNavigate,
		});
		expect(result).toBe(true);
		expect(navigateCalls).toEqual(['/agreements']);
		expect(toastMessages).toEqual([{ type: 'success', message: 'Overeenkomst toegevoegd' }]);
	});

	it('updates an existing agreement', async () => {
		const result = await saveWizardAgreement({
			form: baseForm(),
			agreement: mockAgreementRow(),
			isDuoLesson: false,
			fromRequestId: null,
			fromTrialId: null,
			navigate: recordNavigate,
		});
		expect(result).toBe(true);
		expect(recordedCalls[0]?.op).toBe('update');
		expect(toastMessages).toEqual([{ type: 'success', message: 'Overeenkomst bijgewerkt' }]);
	});

	it('routes duo saves through createAndNotifyDuoAgreements', async () => {
		tableResults['create-duo-agreements'] = {
			data: { agreement_ids: ['agr-1', 'agr-2'], duo_pair_id: 'pair-1' },
			error: null,
		};
		tableResults['send-incasso-invite'] = { data: null, error: null };
		const result = await saveWizardAgreement({
			form: validatedDuoForm(),
			agreement: null,
			isDuoLesson: true,
			fromRequestId: null,
			fromTrialId: null,
			navigate: recordNavigate,
		});
		expect(result).toBe(true);
		expect(navigateCalls).toEqual(['/agreements']);
	});
});
