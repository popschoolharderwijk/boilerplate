import { useCallback, useEffect, useState } from 'react';
import { useNamedCrudDialogState } from '@/hooks/useNamedCrudDialogState';
import { supabase } from '@/integrations/supabase/client';
import {
	executeProjectDomainFetch,
	runProjectDomainDeleteFlow,
	runProjectDomainSaveFlow,
} from '@/lib/projects/projectDomainsManagerControllerHelpers';
import type { ProjectDomain } from '@/types/projects';

export function useProjectDomainsManager(onDomainsChange?: () => void) {
	const [domains, setDomains] = useState<ProjectDomain[]>([]);
	const {
		loading,
		setLoading,
		dialogOpen,
		setDialogOpen,
		editing,
		saving,
		setSaving,
		deleteTarget,
		setDeleteTarget,
		openCreate,
		openEdit,
		name,
		setName,
	} = useNamedCrudDialogState<ProjectDomain>();

	const fetchDomains = useCallback(async () => {
		const outcome = await executeProjectDomainFetch(supabase);
		if (outcome.kind === 'success') {
			setDomains(outcome.domains);
		}
		setLoading(false);
	}, [setLoading]);

	useEffect(() => {
		void fetchDomains();
	}, [fetchDomains]);

	const openCreateDomain = () => {
		openCreate(() => setName(''));
	};

	const openEditDomain = (domain: ProjectDomain) => {
		openEdit(domain, () => setName(domain.name));
	};

	const handleSave = () =>
		runProjectDomainSaveFlow({
			name,
			editing,
			supabase,
			setSaving,
			setDialogOpen,
			fetchDomains,
			onDomainsChange,
		});

	const handleDelete = () =>
		runProjectDomainDeleteFlow({
			deleteTarget,
			supabase,
			setDeleteTarget,
			fetchDomains,
			onDomainsChange,
		});

	return {
		domains,
		loading,
		dialogOpen,
		setDialogOpen,
		editing,
		saving,
		deleteTarget,
		setDeleteTarget,
		name,
		setName,
		openCreateDomain,
		openEditDomain,
		handleSave,
		handleDelete,
	};
}
