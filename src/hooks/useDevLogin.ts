import { useEffect, useState } from 'react';
import { runDevLoginAttempt } from '@/lib/auth/devLoginAttempt';
import { persistDevLoginSelection } from '@/lib/auth/devLoginHelpers';
import { resolveDevLoginInitialValue } from '@/lib/auth/devLoginHookHelpers';

export function useDevLogin(autoLogin: boolean) {
	const [selectedValue, setSelectedValue] = useState<string>(() => resolveDevLoginInitialValue());
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			persistDevLoginSelection(selectedValue);
		}
	}, [selectedValue]);

	const handleDevLogin = async (valueOverride?: string) => {
		setIsLoading(true);
		setError(null);

		const result = await runDevLoginAttempt(selectedValue, valueOverride);
		if (result.ok === false) {
			setError(result.error);
		}
		setIsLoading(false);
	};

	const handleValueChange = (value: string) => {
		setSelectedValue(value);
		if (autoLogin) {
			void handleDevLogin(value);
		}
	};

	return {
		selectedValue,
		isLoading,
		error,
		handleDevLogin,
		handleValueChange,
	};
}
