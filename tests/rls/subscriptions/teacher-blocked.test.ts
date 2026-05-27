import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { createClientAs, createClientBypassRLS } from '../../db';
import { unwrap } from '../../utils';
import { fixtures } from '../fixtures';
import { TestUsers } from '../test-users';

/**
 * Verifies that teachers can NOT see incasso/bank/subscription information
 * for their students. Only the student and privileged staff/admin may.
 *
 * We seed a subscription via the service role (bypassing RLS), assert
 * row-level visibility per role, and clean up afterwards.
 */

const agreementId = fixtures.requireAgreementId(TestUsers.STUDENT_009, TestUsers.TEACHER_ALICE);
const FAKE_CUSTOMER_ID = 'cus_rls_test_teacher_blocked';
const FAKE_SUBSCRIPTION_ID = 'sub_rls_test_teacher_blocked';
const FAKE_INVOICE_ID = 'in_rls_test_teacher_blocked';

let subscriptionId: string;

beforeAll(async () => {
	const admin = createClientBypassRLS();
	const { data: sub, error: subErr } = await admin
		.from('subscriptions')
		.insert({
			lesson_agreement_id: agreementId,
			stripe_subscription_id: FAKE_SUBSCRIPTION_ID,
			stripe_customer_id: FAKE_CUSTOMER_ID,
			stripe_price_id: 'price_rls_test',
			status: 'active',
			default_payment_method_brand: 'ideal',
		})
		.select()
		.single();
	if (subErr || !sub) throw new Error(`Failed to seed subscription: ${subErr?.message}`);
	subscriptionId = sub.id;

	const { error: invErr } = await admin.from('subscription_invoices').insert({
		subscription_id: subscriptionId,
		stripe_invoice_id: FAKE_INVOICE_ID,
		amount_due: 1000,
		amount_paid: 1000,
		currency: 'eur',
		status: 'paid',
	});
	if (invErr) throw new Error(`Failed to seed invoice: ${invErr.message}`);
});

afterAll(async () => {
	const admin = createClientBypassRLS();
	await admin.from('subscription_invoices').delete().eq('stripe_invoice_id', FAKE_INVOICE_ID);
	await admin.from('subscriptions').delete().eq('stripe_subscription_id', FAKE_SUBSCRIPTION_ID);
});

describe('RLS: teachers cannot see subscription / incasso data', () => {
	it('teacher of the agreement sees zero subscription rows', async () => {
		const db = await createClientAs(TestUsers.TEACHER_ALICE);
		const rows = unwrap(
			await db.from('subscriptions').select('id').eq('stripe_subscription_id', FAKE_SUBSCRIPTION_ID),
		);
		expect(rows.length).toBe(0);
	});

	it('teacher of the agreement sees zero subscription_invoices rows', async () => {
		const db = await createClientAs(TestUsers.TEACHER_ALICE);
		const rows = unwrap(
			await db.from('subscription_invoices').select('id').eq('stripe_invoice_id', FAKE_INVOICE_ID),
		);
		expect(rows.length).toBe(0);
	});

	it('student of the agreement sees their subscription row', async () => {
		const db = await createClientAs(TestUsers.STUDENT_009);
		const rows = unwrap(
			await db.from('subscriptions').select('id').eq('stripe_subscription_id', FAKE_SUBSCRIPTION_ID),
		);
		expect(rows.length).toBe(1);
	});

	it('student of the agreement sees their subscription_invoices row', async () => {
		const db = await createClientAs(TestUsers.STUDENT_009);
		const rows = unwrap(
			await db.from('subscription_invoices').select('id').eq('stripe_invoice_id', FAKE_INVOICE_ID),
		);
		expect(rows.length).toBe(1);
	});

	it('staff sees the subscription row', async () => {
		const db = await createClientAs(TestUsers.STAFF_ONE);
		const rows = unwrap(
			await db.from('subscriptions').select('id').eq('stripe_subscription_id', FAKE_SUBSCRIPTION_ID),
		);
		expect(rows.length).toBe(1);
	});

	it('unrelated teacher sees zero subscription rows', async () => {
		const db = await createClientAs(TestUsers.TEACHER_BOB);
		const rows = unwrap(
			await db.from('subscriptions').select('id').eq('stripe_subscription_id', FAKE_SUBSCRIPTION_ID),
		);
		expect(rows.length).toBe(0);
	});
});
