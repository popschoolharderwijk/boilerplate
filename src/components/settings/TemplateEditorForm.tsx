import { LuMail, LuRefreshCw } from 'react-icons/lu';
import type { TemplateEditorViewModel } from '@/components/settings/useTemplateEditor';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getEmailTemplateStatusLabel } from '@/lib/email/emailTemplateManagerHelpers';

interface TemplateEditorFormProps {
	vm: TemplateEditorViewModel;
}

export function TemplateEditorForm({ vm }: TemplateEditorFormProps) {
	const {
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
	} = vm;

	return (
		<CardContent className="space-y-4 border-t pt-4">
			<div className="flex justify-end">
				<Button
					type="button"
					variant={isEnabled ? 'default' : 'outline'}
					size="sm"
					onClick={() => setIsEnabled((value) => !value)}
				>
					{getEmailTemplateStatusLabel(isEnabled)}
				</Button>
			</div>

			<div>
				<Label className="text-xs text-muted-foreground">Beschikbare variabelen</Label>
				<div className="mt-1 flex flex-wrap gap-1.5">
					{event.variables.map((variable) => (
						<code
							key={variable}
							className="rounded bg-muted px-1.5 py-0.5 text-xs"
						>{`{{${variable}}}`}</code>
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
				<div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: previewBody }} />
			</div>

			<div className="flex flex-wrap items-end gap-3 pt-2">
				<Button onClick={() => void handleSave()} disabled={saving}>
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
					<Button variant="outline" onClick={() => void handleSendTest()} disabled={sendingTest}>
						<LuMail className="mr-2 h-4 w-4" />
						{sendingTest ? 'Versturen…' : 'Verstuur testmail'}
					</Button>
				</div>
			</div>
		</CardContent>
	);
}
