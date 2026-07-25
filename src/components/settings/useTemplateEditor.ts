import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
	buildEmailTemplateEditorStateFromRow,
	saveEmailTemplateForEvent,
	sendTestEmailForTemplate,
} from '@/lib/email/emailTemplateEditorHelpers';
import { type EmailTemplateRow, renderEmailTemplatePreview } from '@/lib/email/emailTemplateManagerHelpers';
import type { EmailEventDefinition } from '@/lib/email/events';

interface UseTemplateEditorParams {
	event: EmailEventDefinition;
	row: EmailTemplateRow;
	onSaved: (row: EmailTemplateRow) => void;
}

export function useTemplateEditor({ event, row, onSaved }: UseTemplateEditorParams) {
	const { user } = useAuth();
	const [subject, setSubject] = useState(row.subject);
	const [bodyHtml, setBodyHtml] = useState(row.body_html);
	const [isEnabled, setIsEnabled] = useState(row.is_enabled);
	const [saving, setSaving] = useState(false);
	const [testEmail, setTestEmail] = useState(user?.email ?? '');
	const [sendingTest, setSendingTest] = useState(false);

	useEffect(() => {
		const editorState = buildEmailTemplateEditorStateFromRow(row);
		setSubject(editorState.subject);
		setBodyHtml(editorState.body_html);
		setIsEnabled(editorState.is_enabled);
	}, [row]);

	const previewSubject = renderEmailTemplatePreview(subject, event.previewData);
	const previewBody = renderEmailTemplatePreview(bodyHtml, event.previewData);

	const handleSave = async () => {
		setSaving(true);
		const savedRow = await saveEmailTemplateForEvent(
			event.key,
			{ subject, body_html: bodyHtml, is_enabled: isEnabled },
			row,
		);
		setSaving(false);
		if (savedRow) onSaved(savedRow);
	};

	const handleSendTest = async () => {
		setSendingTest(true);
		await sendTestEmailForTemplate(event.key, testEmail, event.previewData);
		setSendingTest(false);
	};

	return {
		event,
		subject,
		bodyHtml,
		isEnabled,
		saving,
		testEmail,
		sendingTest,
		previewSubject,
		previewBody,
		setSubject,
		setBodyHtml,
		setIsEnabled,
		setTestEmail,
		handleSave,
		handleSendTest,
	};
}

export type TemplateEditorViewModel = ReturnType<typeof useTemplateEditor>;
