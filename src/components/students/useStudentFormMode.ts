import { useCallback, useState } from 'react';
import type { StudentFormMode } from '@/components/students/studentFormTypes';
import { fetchProfileContactByUserId } from '@/lib/profiles/fetchProfileContact';

export function useStudentFormMode() {
	const [mode, setMode] = useState<StudentFormMode>('new-user');
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

	const resetMode = useCallback(() => {
		setMode('new-user');
		setSelectedUserId(null);
	}, []);

	const selectExistingUser = useCallback((userId: string | null, setEmail: (email: string) => void) => {
		setSelectedUserId(userId);
		if (!userId) return;
		void fetchProfileContactByUserId(userId).then((profile) => {
			if (!profile) return;
			setEmail(profile.email);
		});
	}, []);

	const switchToNewUserMode = useCallback((clearEmail: () => void) => {
		setMode('new-user');
		setSelectedUserId(null);
		clearEmail();
	}, []);

	const switchToExistingUserMode = useCallback((clearEmail: () => void) => {
		setMode('existing-user');
		clearEmail();
	}, []);

	return {
		mode,
		selectedUserId,
		resetMode,
		selectExistingUser,
		switchToNewUserMode,
		switchToExistingUserMode,
	};
}
