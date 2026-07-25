import { useState } from 'react';
import { LuInbox } from 'react-icons/lu';
import { Navigate, useNavigate } from 'react-router-dom';
import { ScheduleTrialLessonDialog } from '@/components/trial-lessons/ScheduleTrialLessonDialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { useSignupRequestsPageController } from '@/hooks/useSignupRequestsPageController';
import {
	buildScheduleTrialSignupRequestPayload,
	resolveSignupRequestsPageGate,
	resolveSignupStatusFilterVariant,
} from '@/lib/signup-requests/signupRequestsPageShellHelpers';

export default function SignupRequests() {
	const { isPrivileged, isLoading } = useAuth();
	const navigate = useNavigate();
	const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
	const controller = useSignupRequestsPageController({ isPrivileged, navigate, statusFilter });
	const pageGate = resolveSignupRequestsPageGate(isLoading, isPrivileged);

	if (pageGate === 'loading') return null;
	if (pageGate === 'denied') return <Navigate to="/" replace />;

	return (
		<>
			<PageHeader
				icon={<LuInbox className="h-6 w-6" />}
				title="Aanmeldingen"
				subtitle="Publieke aanmeldingen verwerken"
			/>
			<div className="mt-6 flex gap-2 mb-3">
				<Button
					size="sm"
					variant={resolveSignupStatusFilterVariant(statusFilter, 'pending')}
					onClick={() => setStatusFilter('pending')}
				>
					Open
				</Button>
				<Button
					size="sm"
					variant={resolveSignupStatusFilterVariant(statusFilter, 'all')}
					onClick={() => setStatusFilter('all')}
				>
					Alle
				</Button>
			</div>
			<DataTable
				title="Aanmeldingen"
				columns={controller.columns}
				data={controller.rows}
				loading={controller.loading}
				getRowKey={(row) => row.id}
			/>
			<ScheduleTrialLessonDialog
				open={controller.trialFor !== null}
				onOpenChange={(open) => !open && controller.setTrialFor(null)}
				signupRequest={buildScheduleTrialSignupRequestPayload(controller.trialFor)}
				onScheduled={() => {
					controller.setTrialFor(null);
					controller.loadSignupRequests();
				}}
			/>
		</>
	);
}
