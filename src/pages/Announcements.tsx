import { LuMegaphone } from 'react-icons/lu';
import { Navigate } from 'react-router-dom';
import { AnnouncementsManager } from '@/components/settings/AnnouncementsManager';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';

export default function Announcements() {
	const { isAdmin, isSiteAdmin, isLoading } = useAuth();

	if (isLoading) return null;
	if (!(isAdmin || isSiteAdmin)) return <Navigate to="/" replace />;

	return (
		<div className="space-y-6">
			<PageHeader
				icon={<LuMegaphone className="h-6 w-6" />}
				title="Nieuwsberichten"
				subtitle="Plaats berichten voor docenten en leerlingen op hun dashboard"
			/>
			<AnnouncementsManager />
		</div>
	);
}
