import { DevLoginErrorMessage, DevLoginSelectField, DevLoginSubmitButton } from '@/components/DevLoginButtonParts';
import { useDevLogin } from '@/hooks/useDevLogin';
import { resolveDevLoginInnerContainerClass } from '@/lib/auth/devLoginButtonHelpers';
import { cn } from '@/lib/utils';

/**
 * Development-only quick login button with role selection.
 * This component is completely removed from production builds via dead-code elimination.
 * Early return in production ensures all code below is tree-shaken.
 */
export function DevLoginButton({
	className,
	showButton = true,
	autoLogin = false,
}: {
	className?: string;
	showButton?: boolean;
	autoLogin?: boolean;
}) {
	if (import.meta.env.MODE === 'production') {
		return null;
	}

	return <DevLoginButtonInner className={className} showButton={showButton} autoLogin={autoLogin} />;
}

function DevLoginButtonInner({
	className,
	showButton = true,
	autoLogin = false,
}: {
	className?: string;
	showButton?: boolean;
	autoLogin?: boolean;
}) {
	const { selectedValue, isLoading, error, handleDevLogin, handleValueChange } = useDevLogin(autoLogin);
	const isLocalDev = import.meta.env.MODE === 'localdev';

	return (
		<div className={cn('flex flex-col w-full', className)}>
			<div className={resolveDevLoginInnerContainerClass(showButton, isLocalDev)}>
				<DevLoginSelectField
					selectedValue={selectedValue}
					isLoading={isLoading}
					onValueChange={handleValueChange}
				/>
				{showButton && (
					<DevLoginSubmitButton
						isLoading={isLoading}
						isLocalDev={isLocalDev}
						onLogin={() => void handleDevLogin()}
					/>
				)}
			</div>
			<DevLoginErrorMessage error={error} />
		</div>
	);
}
