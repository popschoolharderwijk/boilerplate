import { describe, expect, it } from 'bun:test';
import {
	AGENDA_EVENT_TYPE_ICON_CLASS,
	resolveAgendaEventTypeIconMeta,
} from '../../../src/lib/agenda/agendaEventTypeIconHelpers';

describe('resolveAgendaEventTypeIconMeta', () => {
	it('returns trial icon metadata', () => {
		const meta = resolveAgendaEventTypeIconMeta('trial');
		expect(meta?.title).toBe('Proefles');
		expect(meta?.Icon).toBeDefined();
	});

	it('returns project icon metadata', () => {
		const meta = resolveAgendaEventTypeIconMeta('project');
		expect(meta?.title).toBe('Project');
	});

	it('returns lesson group icon metadata', () => {
		const meta = resolveAgendaEventTypeIconMeta('lesson_group');
		expect(meta?.title).toBe('Groepsles');
	});

	it('returns duo icon metadata', () => {
		const meta = resolveAgendaEventTypeIconMeta('duo');
		expect(meta?.title).toBe('Duo-les');
	});

	it('returns lesson icon metadata', () => {
		const meta = resolveAgendaEventTypeIconMeta('lesson');
		expect(meta?.title).toBe('Les');
	});

	it('returns multi participant icon metadata', () => {
		const meta = resolveAgendaEventTypeIconMeta('multi_participant');
		expect(meta?.title).toBe('Meerdere deelnemers');
	});

	it('returns null for missing icon type', () => {
		expect(resolveAgendaEventTypeIconMeta(null)).toBeNull();
	});
});

describe('AGENDA_EVENT_TYPE_ICON_CLASS', () => {
	it('contains shared icon sizing classes', () => {
		expect(AGENDA_EVENT_TYPE_ICON_CLASS).toBe('h-3 w-3 shrink-0 mt-0.5 drop-shadow-md');
	});
});
