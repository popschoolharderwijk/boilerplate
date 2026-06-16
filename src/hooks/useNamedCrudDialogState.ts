import { useState } from 'react';
import { useCrudDialogState } from './useCrudDialogState';

/** CRUD dialog state with a single `name` form field. */
export function useNamedCrudDialogState<T>() {
	const crud = useCrudDialogState<T>();
	const [name, setName] = useState('');

	return {
		...crud,
		name,
		setName,
	};
}
