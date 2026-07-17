import { LuGraduationCap } from 'react-icons/lu';
import { MyTrialBody } from '@/components/trial-lessons/MyTrialBody';
import { PageHeader } from '@/components/ui/page-header';
import { useMyTrialPage } from '@/hooks/useMyTrialPage';
import { resolveMyTrialContentState } from '@/lib/trial-lessons/myTrialPageHelpers';

interface MyTrialPageContentProps {
	userId: string;
}

export function MyTrialPageContent({ userId }: MyTrialPageContentProps) {
	const { loading, latest, busyId, decide } = useMyTrialPage(userId);
	const contentState = resolveMyTrialContentState(loading, latest !== undefined);

	return (
		<>
			<PageHeader
				icon={<LuGraduationCap className="h-6 w-6" />}
				title="Mijn proefles"
				subtitle="Bekijk je proefles en geef aan of je verder wilt"
			/>
			<MyTrialBody contentState={contentState} latest={latest} busyId={busyId} onDecide={decide} />
		</>
	);
}
