import { ProjectDomainsManagerCard } from '@/components/projects/ProjectDomainsManagerParts';
import { useProjectDomainsManager } from '@/hooks/useProjectDomainsManager';

interface ProjectDomainsManagerProps {
	/** Called after domains list changed (add/update/delete) so sibling components can refresh */
	onDomainsChange?: () => void;
}

export function ProjectDomainsManager({ onDomainsChange }: ProjectDomainsManagerProps = {}) {
	return <ProjectDomainsManagerCard state={useProjectDomainsManager(onDomainsChange)} />;
}
