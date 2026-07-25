import { describe, expect, it } from 'bun:test';
import { buildSlotCountByProject, mapProjectRow } from '../../../src/lib/projects/projectsPageMappers';

const rawProject = {
	id: 'proj-1',
	name: 'Project A',
	description: 'Desc',
	cost_center: 'KP-1',
	is_active: true,
	owner_user_id: 'owner-1',
	label_id: 'label-1',
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-02T00:00:00Z',
	created_by: null,
	updated_by: null,
};

describe('buildSlotCountByProject', () => {
	it('initializes all project ids to zero and counts agenda events', () => {
		const counts = buildSlotCountByProject(
			['proj-1', 'proj-2'],
			[{ source_id: 'proj-1' }, { source_id: 'proj-1' }, { source_id: null }],
		);
		expect(counts.get('proj-1')).toBe(2);
		expect(counts.get('proj-2')).toBe(0);
	});
});

describe('mapProjectRow', () => {
	it('maps joined label, domain, owner, and slot count fields', () => {
		const labelMap = new Map([['label-1', { name: 'Label A', domain_id: 'domain-1' }]]);
		const domainMap = new Map([['domain-1', { name: 'Domain A' }]]);
		const profileMap = new Map([
			[
				'owner-1',
				{
					first_name: 'Anna',
					last_name: 'Bakker',
					email: 'anna@example.com',
					avatar_url: null,
				},
			],
		]);
		const slotCountByProject = new Map([['proj-1', 3]]);

		expect(mapProjectRow(rawProject, labelMap, domainMap, profileMap, slotCountByProject)).toEqual({
			...rawProject,
			label_name: 'Label A',
			domain_name: 'Domain A',
			owner_first_name: 'Anna',
			owner_last_name: 'Bakker',
			owner_email: 'anna@example.com',
			owner_avatar_url: null,
			slot_count: 3,
		});
	});

	it('uses fallback values for missing relations', () => {
		expect(mapProjectRow(rawProject, new Map(), new Map(), new Map(), new Map())).toEqual({
			...rawProject,
			label_name: '—',
			domain_name: '—',
			owner_first_name: null,
			owner_last_name: null,
			owner_email: null,
			owner_avatar_url: null,
			slot_count: 0,
		});
	});
});
