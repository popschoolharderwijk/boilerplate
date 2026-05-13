import { useEffect, useState } from 'react';
import { LuMail, LuRefreshCw } from 'react-icons/lu';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { type EmailEventDefinition, listEmailEvents } from '@/lib/email/events';

interface TemplateRow {
	event_key: string;
	subject: string;
	body_html: string;
	is_enabled: boolean;
}

function renderPreview(template: string, vars: Record<string, string>): string {
	return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
		const v = vars[key];
		return v !== undefined ? v : match;
	});
}

function TemplateEditor({
	event,
	row,
	onSaved,
}: {
	event: EmailEventDefinition;
	row: TemplateRow;
	onSaved: (r: TemplateRow) => void;
}) {
	const { user } = useAuth();
	const [subject, setSubject] = useState(row.subject);
	const [bodyHtml, setBodyHtml] = useState(row.body_html);
	const [isEnabled, setIsEnabled] = useState(row.is_enabled);
	const [saving, setSaving] = useState(false);
	const [testEmail, setTestEmail] = useState(user?.email ?? '');
	const [sendingTest, setSendingTest] = useState(false);

	useEffect(() => {
		setSubject(row.subject);
		setBodyHtml(row.body_html);
		setIsEnabled(row.is_enabled);
	}, [row.event_key, row.subject, row.body_html, row.is_enabled]);

	const previewSubject = renderPreview(subject, event.previewData);
	const previewBody = renderPreview(bodyHtml, event.previewData);

	const handleSave = async () => {
		setSaving(true);
		const { error } = await supabase
			.from('email_templates')
			.update({ subject, body_html: bodyHtml, is_enabled: isEnabled })
			.eq('event_key', event.key);
		setSaving(false);
		if (error) {
			toast.error('Opslaan mislukt');
			console.error(error);
			return;
		}
		toast.success('Template opgeslagen');
		onSaved({ ...row, subject, body_html: bodyHtml, is_enabled: isEnabled });
	};

	const handleSendTest = async () => {
		if (!testEmail) {
			toast.error('Vul een testadres in');
			return;
		}
		setSendingTest(true);
		const { data, error } = await supabase.functions.invoke('send-template-email', {
			body: {
				event_key: event.key,
				to: testEmail,
				vars: event.previewData,
			},
		});
		setSendingTest(false);
		if (error) {
			toast.error('Versturen mislukt');
			console.error(error);
			return;
		}
		if ((data as { skipped?: boolean })?.skipped) {
			toast.warning('Template staat uit — geen mail verstuurd');
		} else {
			toast.success(`Testmail verstuurd naar ${testEmail}`);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<div>
						<CardTitle>{event.label}</CardTitle>
						<CardDescription>{event.description}</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant={isEnabled ? 'default' : 'outline'}
							size="sm"
							onClick={() => setIsEnabled((v) => !v)}
						>
							{isEnabled ? 'Actief' : 'Uitgeschakeld'}
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<Label className="text-xs text-muted-foreground">Beschikbare variabelen</Label>
					<div className="mt-1 flex flex-wrap gap-1.5">
						{event.variables.map((v) => (
							<code key={v} className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{{${v}}}`}</code>
						))}
					</div>
				</div>

				<div>
					<Label htmlFor={`subject-${event.key}`}>Onderwerp</Label>
					<Input
						id={`subject-${event.key}`}
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						className="mt-1"
					/>
				</div>

				<div>
					<Label htmlFor={`body-${event.key}`}>Inhoud (HTML)</Label>
					<Textarea
						id={`body-${event.key}`}
						value={bodyHtml}
						onChange={(e) => setBodyHtml(e.target.value)}
						className="mt-1 font-mono text-sm min-h-[200px]"
					/>
				</div>

				<div className="rounded-md border bg-muted/30 p-4">
					<div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
						<LuRefreshCw className="h-3 w-3" />
						Preview met voorbeeldgegevens
					</div>
					<div className="text-sm font-semibold mb-2">{previewSubject}</div>
					{/** biome-ignore lint/security/noDangerouslySetInnerHtml: admin-only HTML preview */}
					<div
						className="prose prose-sm max-w-none text-sm"
						dangerouslySetInnerHTML={{ __html: previewBody }}
					/>
				</div>

				<div className="flex flex-wrap items-end gap-3 pt-2">
					<Button onClick={handleSave} disabled={saving}>
						{saving ? 'Opslaan…' : 'Opslaan'}
					</Button>
					<div className="flex items-end gap-2">
						<div>
							<Label htmlFor={`test-${event.key}`} className="text-xs">
								Testmail naar
							</Label>
							<Input
								id={`test-${event.key}`}
								type="email"
								value={testEmail}
								onChange={(e) => setTestEmail(e.target.value)}
								className="mt-1 w-64"
							/>
						</div>
						<Button variant="outline" onClick={handleSendTest} disabled={sendingTest}>
							<LuMail className="mr-2 h-4 w-4" />
							{sendingTest ? 'Versturen…' : 'Verstuur testmail'}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function EmailTemplatesManager() {
	const events = listEmailEvents();
	const [rows, setRows] = useState<Record<string, TemplateRow> | null>(null);

	useEffect(() => {
		(async () => {
			const { data, error } = await supabase
				.from('email_templates')
				.select('event_key, subject, body_html, is_enabled');
			if (error) {
				toast.error('Kon templates niet laden');
				console.error(error);
				return;
			}
			const map: Record<string, TemplateRow> = {};
			for (const r of data ?? []) map[r.event_key] = r as TemplateRow;
			setRows(map);
		})();
	}, []);

	if (!rows) return <Skeleton className="h-64 w-full" />;

	return (
		<div className="space-y-6">
			{events.map((event) => {
				const row = rows[event.key];
				if (!row) {
					return (
						<Card key={event.key}>
							<CardHeader>
								<CardTitle>{event.label}</CardTitle>
								<CardDescription>
									Geen template-rij in de database voor <code>{event.key}</code>. Voeg deze toe via
									een migratie.
								</CardDescription>
							</CardHeader>
						</Card>
					);
				}
				return (
					<TemplateEditor
						key={event.key}
						event={event}
						row={row}
						onSaved={(r) => setRows((prev) => ({ ...(prev ?? {}), [event.key]: r }))}
					/>
				);
			})}
		</div>
	);
}
