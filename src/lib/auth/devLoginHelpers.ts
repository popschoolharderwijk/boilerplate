type DevLoginRole = 'site_admin' | 'admin' | 'teacher' | 'staff' | 'student' | 'user' | 'dev';

export interface DevUser {
	email: string;
	firstName: string;
	description?: string;
}

export const DEV_TEACHERS: DevUser[] = [
	{ email: 'teacher-alice@test.nl', firstName: 'Alice', description: 'Veel leerlingen' },
	{ email: 'teacher-jack@test.nl', firstName: 'Jacques', description: 'Geen leerlingen' },
	{ email: 'teacher-eve@test.nl', firstName: 'Eva', description: 'Bandcoaching' },
];

export const DEV_STUDENTS: DevUser[] = [
	{ email: 'student-001@test.nl', firstName: 'Lucas', description: 'Met Bandcoaching' },
	{ email: 'student-009@test.nl', firstName: 'Luuk', description: 'Zonder Bandcoaching' },
	{ email: 'student-010@test.nl', firstName: 'Bram', description: 'Zonder Bandcoaching' },
];

export const DEV_USERS: DevUser[] = [
	{ email: 'user-001@test.nl', firstName: 'Koen' },
	{ email: 'user-002@test.nl', firstName: 'Rik' },
	{ email: 'user-003@test.nl', firstName: 'Tim' },
];

export const DEV_ROLES: DevUser[] = [
	{ email: 'site-admin@test.nl', firstName: 'Jan-Willem', description: 'Site Admin' },
	{ email: 'admin-one@test.nl', firstName: 'Sophie', description: 'Admin' },
	{ email: 'staff-one@test.nl', firstName: 'Lisa', description: 'Medewerker' },
];

const ROLE_EMAILS: Record<Exclude<DevLoginRole, 'dev'>, string> = {
	site_admin: 'site-admin@test.nl',
	admin: 'admin-one@test.nl',
	teacher: 'teacher-alice@test.nl',
	staff: 'staff-one@test.nl',
	student: 'student-001@test.nl',
	user: 'user-001@test.nl',
};

function getAllDevLoginEmails(): string[] {
	return [...DEV_ROLES, ...DEV_TEACHERS, ...DEV_STUDENTS, ...DEV_USERS].map((user) => user.email);
}

function convertLegacyDevLoginRole(storedRole: string): string {
	if (storedRole === 'site_admin') return 'site-admin@test.nl';
	if (storedRole === 'admin') return 'admin-one@test.nl';
	if (storedRole === 'staff') return 'staff-one@test.nl';
	return storedRole;
}

export function resolveStoredDevLoginValue(storedRole: string | null, storedDevUser: string | null): string {
	const allDevEmails = getAllDevLoginEmails();
	if (storedDevUser && allDevEmails.includes(storedDevUser)) {
		return storedDevUser;
	}
	if (storedRole && (Object.keys(ROLE_EMAILS).includes(storedRole) || storedRole === 'dev')) {
		return convertLegacyDevLoginRole(storedRole);
	}
	return DEV_ROLES[0]?.email ?? 'site-admin@test.nl';
}

export function persistDevLoginSelection(selectedValue: string): void {
	const allDevEmails = getAllDevLoginEmails();
	if (allDevEmails.includes(selectedValue)) {
		localStorage.setItem('dev-login-selected-dev-user', selectedValue);
		localStorage.setItem('dev-login-selected-role', 'dev');
		return;
	}
	localStorage.setItem('dev-login-selected-role', selectedValue);
	localStorage.removeItem('dev-login-selected-dev-user');
}

export function resolveDevLoginEmail(value: string): string | null {
	const allDevEmails = getAllDevLoginEmails();
	if (allDevEmails.includes(value)) return value;
	if (value in ROLE_EMAILS) return ROLE_EMAILS[value as Exclude<DevLoginRole, 'dev'>];
	return null;
}

export function getDevLoginErrorMessage(errorMessage: string, email: string): string {
	if (errorMessage.includes('Invalid login credentials')) {
		return `Inloggen mislukt voor ${email}. Controleer VITE_DEV_LOGIN_PASSWORD.`;
	}
	return `${errorMessage} (email: ${email})`;
}
