import { AnnouncementsEditorDialog, AnnouncementsManagerCard } from '@/components/settings/AnnouncementsManagerParts';
import { useAnnouncementsManager } from '@/hooks/useAnnouncementsManager';

export function AnnouncementsManager() {
	const state = useAnnouncementsManager();

	return (
		<>
			<AnnouncementsManagerCard state={state} />
			<AnnouncementsEditorDialog state={state} />
		</>
	);
}
