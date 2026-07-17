import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { runProjectPageAction } from '@/lib/projects/projectsPageControllerHelpers';
import { fetchProjectRows, type ProjectAction } from '@/lib/projects/projectsPageHelpers';
import type { ProjectRow } from '@/types/projects';

interface UseProjectsPageControllerParams {
	authLoading: boolean;
	canView: boolean;
}

export function useProjectsPageController(params: UseProjectsPageControllerParams) {
	const [projects, setProjects] = useState<ProjectRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [formDialog, setFormDialog] = useState<{ open: boolean; project: ProjectRow | null }>({
		open: false,
		project: null,
	});
	const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; project: ProjectRow | null } | null>(null);
	const [settingsModalOpen, setSettingsModalOpen] = useState(false);
	const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
	const refetchLabelsRef = useRef<() => void>();

	const loadProjects = useCallback(async () => {
		if (params.authLoading || !params.canView) return;

		setLoading(true);
		const result = await fetchProjectRows(supabase);
		if (result.error) {
			console.error('Error loading projects:', result.error);
			toast.error('Fout bij laden projecten');
			setLoading(false);
			return;
		}
		setProjects(result.projects);
		setLoading(false);
	}, [params.authLoading, params.canView]);

	useEffect(() => {
		void loadProjects();
	}, [loadProjects]);

	const runAction = (action: ProjectAction) =>
		runProjectPageAction(action, deleteDialog, { setFormDialog, setDeleteDialog, setProjects });

	return {
		projects,
		loading,
		searchQuery,
		setSearchQuery,
		formDialog,
		setFormDialog,
		deleteDialog,
		setDeleteDialog,
		settingsModalOpen,
		setSettingsModalOpen,
		expandedProjectId,
		setExpandedProjectId,
		refetchLabelsRef,
		loadProjects,
		runAction,
	};
}
