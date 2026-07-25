import { afterAll, beforeAll, describe, it } from 'bun:test';
import { createClientAnon } from '../../db';
import { expectInsufficientPrivilege, unwrapError } from '../../utils';
import { type DatabaseState, setupDatabaseStateVerification } from '../db-state';

let initialState: DatabaseState;
const { setupState, verifyState } = setupDatabaseStateVerification();

beforeAll(async () => {
	initialState = await setupState();
});

afterAll(async () => {
	await verifyState(initialState);
});

const fakeUuid = '00000000-0000-0000-0000-000000000001';

describe('RLS: anonymous – stripe_customers / subscriptions / subscription_invoices', () => {
	it('anon select on stripe_customers is privilege-denied', async () => {
		const db = createClientAnon();
		expectInsufficientPrivilege(unwrapError(await db.from('stripe_customers').select('*').limit(1)));
	});

	it('anon cannot insert stripe_customers', async () => {
		const db = createClientAnon();
		expectInsufficientPrivilege(
			unwrapError(
				await db
					.from('stripe_customers')
					.insert({ user_id: fakeUuid, stripe_customer_id: 'cus_anon' })
					.select(),
			),
		);
	});

	it('anon select on subscriptions is privilege-denied', async () => {
		const db = createClientAnon();
		expectInsufficientPrivilege(unwrapError(await db.from('subscriptions').select('*').limit(1)));
	});

	it('anon cannot insert subscriptions', async () => {
		const db = createClientAnon();
		expectInsufficientPrivilege(
			unwrapError(
				await db
					.from('subscriptions')
					.insert({
						lesson_agreement_id: fakeUuid,
						stripe_subscription_id: 'sub_anon',
						stripe_customer_id: 'cus_anon',
						stripe_price_id: 'price_anon',
						status: 'active',
					})
					.select(),
			),
		);
	});

	it('anon select on subscription_invoices is privilege-denied', async () => {
		const db = createClientAnon();
		expectInsufficientPrivilege(unwrapError(await db.from('subscription_invoices').select('*').limit(1)));
	});
});
