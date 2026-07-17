export interface EmailTemplateRow {
	event_key: string;
	subject: string;
	body_html: string;
	is_enabled: boolean;
}

export interface EmailTemplateEditorState {
	subject: string;
	body_html: string;
	is_enabled: boolean;
}

export function renderEmailTemplatePreview(template: string, vars: Record<string, string>): string {
	return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
		const value = vars[key];
		return value !== undefined ? value : match;
	});
}

export function buildEmailTemplateRowsMap(rows: EmailTemplateRow[]): Record<string, EmailTemplateRow> {
	const map: Record<string, EmailTemplateRow> = {};
	for (const row of rows) {
		map[row.event_key] = row;
	}
	return map;
}

export function toggleEmailTemplateActiveKey(activeKey: string | null, eventKey: string): string | null {
	return activeKey === eventKey ? null : eventKey;
}

export function resolveEmailTemplateTestResult(data: { skipped?: boolean } | null): 'skipped' | 'sent' {
	return data?.skipped ? 'skipped' : 'sent';
}

export function mergeSavedEmailTemplateRow(row: EmailTemplateRow, editor: EmailTemplateEditorState): EmailTemplateRow {
	return {
		...row,
		subject: editor.subject,
		body_html: editor.body_html,
		is_enabled: editor.is_enabled,
	};
}

export function getEmailTemplateStatusLabel(isEnabled: boolean): string {
	return isEnabled ? 'Actief' : 'Uitgeschakeld';
}

export function getEmailTemplateStatusClassName(isEnabled: boolean): string {
	return isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground';
}
