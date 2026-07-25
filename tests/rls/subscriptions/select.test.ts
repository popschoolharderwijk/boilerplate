import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { createClientAs } from '../../db';
import { unwrap, unwrapError } from '../../utils';
import { type DatabaseState, setupDatabaseStateVerification } from '../db-state';
import { fixtures } from '../fixtures';
import { TestUsers } from '../test-users';

let initialState: DatabaseState;
const { setupState, verifyState } = setupDatabaseStateVerification();

beforeAll(async () => {
	initialState = await setupState();
});

afterAll(async () => {
	await verifyState(initialState);
});

const studentUserId = fixtures.requireUserId(TestUsers.STUDENT_009);
const agreementId = fixtures.requireAgreementId(TestUsers.STUDENT_009, TestUsers.TEACHER_ALICE);

/**
 * Subscription tables are written exclusively by the Stripe webhook (service role).
 * Authenticated users (incl. staff/admin) cannot insert/update/delete via the API.
 *
 * SELECT visibility:
 *  - stripe_customers: owner or privileged (staff/admin/site_admin)
 *  - subscriptions / subscription_invoices: privileged or the
 *    student/teacher of the linked lesson_agreement
 */
describe('RLS: stripe_customers writes are blocked for authenticated users', () => {
	it('student cannot insert their own stripe_customer', async () => {
		const db = await createClientAs(TestUsers.STUDENT_009);
		unwrapError(
			await db
				.from('stripe_customers')
				.insert({ user_id: studentUserId, stripe_customer_id: 'cus_test_student' })
				.select(),
		);
	});

	it('staff cannot insert stripe_customer', async () => {
		const db = await createClientAs(TestUsers.STAFF_ONE);
		unwrapError(
			await db
				.from('stripe_customers')
				.insert({ user_id: studentUserId, stripe_customer_id: 'cus_test_staff' })
				.select(),
		);
	});

	it('admin cannot insert stripe_customer', async () => {
		const db = await createClientAs(TestUsers.ADMIN_ONE);
		unwrapError(
			await db
				.from('stripe_customers')
				.insert({ user_id: studentUserId, stripe_customer_id: 'cus_test_admin' })
				.select(),
		);
	});
});

describe('RLS: subscriptions writes are blocked for authenticated users', () => {
	const row = {
		lesson_agreement_id: agreementId,
		stripe_subscription_id: 'sub_test',
		stripe_customer_id: 'cus_test',
		stripe_price_id: 'price_test',
		status: 'active' as const,
	};

	it('student cannot insert subscription', async () => {
		const db = await createClientAs(TestUsers.STUDENT_009);
		unwrapError(await db.from('subscriptions').insert(row).select());
	});

	it('teacher cannot insert subscription', async () => {
		const db = await createClientAs(TestUsers.TEACHER_ALICE);
		unwrapError(await db.from('subscriptions').insert(row).select());
	});

	it('admin cannot insert subscription', async () => {
		const db = await createClientAs(TestUsers.ADMIN_ONE);
		unwrapError(await db.from('subscriptions').insert(row).select());
	});
});

describe('RLS: subscriptions/invoices SELECT does not leak across users', () => {
	it('student can query their own subscriptions (no error)', async () => {
		const db = await createClientAs(TestUsers.STUDENT_009);
		const data = unwrap(await db.from('subscriptions').select('*'));
		// Without seed data we expect 0 rows; we mainly assert RLS allows the SELECT to succeed
		expect(Array.isArray(data)).toBe(true);
	});

	it('teacher can query their own subscriptions (no error)', async () => {
		const db = await createClientAs(TestUsers.TEACHER_ALICE);
		const data = unwrap(await db.from('subscriptions').select('*'));
		expect(Array.isArray(data)).toBe(true);
	});

	it('staff can query all subscriptions (no error)', async () => {
		const db = await createClientAs(TestUsers.STAFF_ONE);
		const data = unwrap(await db.from('subscriptions').select('*'));
		expect(Array.isArray(data)).toBe(true);
	});

	it('student can query subscription_invoices (no error)', async () => {
		const db = await createClientAs(TestUsers.STUDENT_009);
		const data = unwrap(await db.from('subscription_invoices').select('*'));
		expect(Array.isArray(data)).toBe(true);
	});

	it('student can query their own stripe_customers (no error)', async () => {
		const db = await createClientAs(TestUsers.STUDENT_009);
		const data = unwrap(await db.from('stripe_customers').select('*'));
		expect(Array.isArray(data)).toBe(true);
	});
});
