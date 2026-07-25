import { ProjectLabelsManagerCard } from '@/components/projects/ProjectLabelsManagerParts';
import { useProjectLabelsManager } from '@/hooks/useProjectLabelsManager';

interface ProjectLabelsManagerProps {
	/** Called with the refetch function so the parent can trigger a refresh (e.g. when domains change in a sibling) */
	registerRefetch?: (refetch: () => void) => void;
}

export function ProjectLabelsManager({ registerRefetch }: ProjectLabelsManagerProps = {}) {
	return <ProjectLabelsManagerCard state={useProjectLabelsManager(registerRefetch)} />;
}
