import { Navigate } from 'react-router-dom';
import { useLoginPage } from '@/hooks/useLoginPage';
import { resolveLoginPageContent } from '@/lib/auth/loginPageHelpers';
import { LoginPageBody } from '@/pages/LoginPageBody';

function LoginLoadingScreen() {
	return (
		<div className="min-h-screen flex items-center justify-center">
			<p className="text-muted-foreground">Laden...</p>
		</div>
	);
}

export default function Login() {
	const login = useLoginPage();
	const pageContent = resolveLoginPageContent(login.shouldRedirect, login.showLoadingScreen);

	if (pageContent === 'redirect') {
		return <Navigate to="/" replace />;
	}

	if (pageContent === 'loading') {
		return <LoginLoadingScreen />;
	}

	return <LoginPageBody login={login} />;
}
