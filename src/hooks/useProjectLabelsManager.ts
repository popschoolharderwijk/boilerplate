import { useCallback, useEffect, useState } from 'react';
import { useNamedCrudDialogState } from '@/hooks/useNamedCrudDialogState';
import { supabase } from '@/integrations/supabase/client';
import {
	executeProjectLabelFetch,
	type LabelWithDomain,
	runProjectLabelDeleteFlow,
	runProjectLabelSaveFlow,
} from '@/lib/projects/projectLabelsManagerControllerHelpers';
import type { ProjectDomain } from '@/types/projects';

export function useProjectLabelsManager(registerRefetch?: (refetch: () => void) => void) {
	const [labels, setLabels] = useState<LabelWithDomain[]>([]);
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
	} = useNamedCrudDialogState<LabelWithDomain>();
	const [domainId, setDomainId] = useState('');

	const fetchData = useCallback(async () => {
		const outcome = await executeProjectLabelFetch(supabase);
		if (outcome.kind === 'success') {
			setLabels(outcome.labels);
			setDomains(outcome.domains);
		}
		setLoading(false);
	}, [setLoading]);

	useEffect(() => {
		void fetchData();
	}, [fetchData]);

	useEffect(() => {
		registerRefetch?.(fetchData);
	}, [registerRefetch, fetchData]);

	const openCreateLabel = () => {
		openCreate(() => {
			setName('');
			setDomainId('');
		});
	};

	const openEditLabel = (label: LabelWithDomain) => {
		openEdit(label, () => {
			setName(label.name);
			setDomainId(label.domain_id);
		});
	};

	const handleSave = () =>
		runProjectLabelSaveFlow({
			name,
			domainId,
			editing,
			supabase,
			setSaving,
			setDialogOpen,
			fetchData,
		});

	const handleDelete = () =>
		runProjectLabelDeleteFlow({
			deleteTarget,
			supabase,
			setDeleteTarget,
			fetchData,
		});

	return {
		labels,
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
		domainId,
		setDomainId,
		openCreateLabel,
		openEditLabel,
		handleSave,
		handleDelete,
	};
}
