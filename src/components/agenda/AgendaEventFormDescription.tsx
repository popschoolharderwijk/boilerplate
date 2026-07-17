import { Textarea } from '@/components/ui/textarea';

interface AgendaEventFormDescriptionProps {
	showDescription: boolean;
	setShowDescription: (value: boolean) => void;
	description: string;
	setDescription: (value: string) => void;
	isCancelledEvent: boolean;
}

export function AgendaEventFormDescription({
	showDescription,
	setShowDescription,
	description,
	setDescription,
	isCancelledEvent,
}: AgendaEventFormDescriptionProps) {
	if (showDescription) {
		return (
			<Textarea
				id="description"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				placeholder="Omschrijving toevoegen"
				disabled={isCancelledEvent}
				rows={2}
				autoFocus={!description}
			/>
		);
	}

	if (isCancelledEvent) return null;

	return (
		<button
			type="button"
			onClick={() => setShowDescription(true)}
			className="text-sm text-muted-foreground hover:text-foreground transition-colors"
		>
			+ Omschrijving toevoegen
		</button>
	);
}
