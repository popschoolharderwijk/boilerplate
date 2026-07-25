import { useCallback, useState } from 'react';

export function useCrudDialogState<T>() {
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<T | null>(null);
	const [saving, setSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

	const openCreate = useCallback((reset?: () => void) => {
		setEditing(null);
		reset?.();
		setDialogOpen(true);
	}, []);

	const openEdit = useCallback((item: T, init?: (item: T) => void) => {
		setEditing(item);
		init?.(item);
		setDialogOpen(true);
	}, []);

	return {
		loading,
		setLoading,
		dialogOpen,
		setDialogOpen,
		editing,
		setEditing,
		saving,
		setSaving,
		deleteTarget,
		setDeleteTarget,
		openCreate,
		openEdit,
	};
}
