import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { applyAccountProfileLoadResult } from '@/lib/account/accountPageControllerHelpers';
import { loadAccountProfile } from '@/lib/account/accountPageHelpers';
import type { AccountFormData, AccountProfileState } from '@/lib/account/persistence';

interface UseAccountPageProfileLoadParams {
	userId: string | undefined;
	setProfile: Dispatch<SetStateAction<AccountProfileState | null>>;
	setFormData: Dispatch<SetStateAction<AccountFormData>>;
	setLoading: Dispatch<SetStateAction<boolean>>;
}

export function useAccountPageProfileLoad({
	userId,
	setProfile,
	setFormData,
	setLoading,
}: UseAccountPageProfileLoadParams): void {
	useEffect(() => {
		if (!userId) return;
		setLoading(true);
		void loadAccountProfile(userId).then((data) => {
			const loaded = applyAccountProfileLoadResult(data);
			if (loaded.profile && loaded.formData) {
				setProfile(loaded.profile);
				setFormData(loaded.formData);
			}
			setLoading(false);
		});
	}, [userId, setProfile, setFormData, setLoading]);
}
