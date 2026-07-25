import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { createClientAnon } from '../../db';
import { expectInsufficientPrivilege, unwrap, unwrapError } from '../../utils';
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

describe('RLS: anonymous – invoices / invoice_lines', () => {
	it('anon select on invoices returns no rows', async () => {
		const db = createClientAnon();
		const data = unwrap(await db.from('invoices').select('*'));
		expect(data).toHaveLength(0);
	});

	it('anon cannot insert invoices', async () => {
		const db = createClientAnon();
		expectInsufficientPrivilege(
			unwrapError(
				await db
					.from('invoices')
					.insert({
						invoice_number: 'X-ANON',
						student_user_id: fakeUuid,
						due_date: '2030-01-01',
					})
					.select(),
			),
		);
	});

	it('anon select on invoice_lines returns no rows', async () => {
		const db = createClientAnon();
		const data = unwrap(await db.from('invoice_lines').select('*'));
		expect(data).toHaveLength(0);
	});

	it('anon cannot insert invoice_lines', async () => {
		const db = createClientAnon();
		expectInsufficientPrivilege(
			unwrapError(
				await db
					.from('invoice_lines')
					.insert({
						invoice_id: fakeUuid,
						description: 'x',
						amount_excl_btw_cents: 100,
						btw_amount_cents: 0,
						amount_total_cents: 100,
					})
					.select(),
			),
		);
	});
});
