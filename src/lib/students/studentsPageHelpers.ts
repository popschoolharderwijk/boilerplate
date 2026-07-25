import type { StudentWithAgreements } from '@/types/students';

export async function deleteStudentAgreements(agreementIds: string[]): Promise<{ error: string | null }> {
	if (agreementIds.length === 0) return { error: null };

	const { supabase } = await import('@/integrations/supabase/client');
	const { error: agreementsError } = await supabase.from('lesson_agreements').delete().in('id', agreementIds);
	if (agreementsError) {
		console.error('Error deleting lesson agreements:', agreementsError);
		return { error: agreementsError.message };
	}
	return { error: null };
}

export async function deleteStudentUser(userId: string): Promise<{ error: string | null }> {
	const { supabase } = await import('@/integrations/supabase/client');
	const { error: userDeleteError } = await supabase.functions.invoke('delete-user', {
		body: { userId },
	});
	if (userDeleteError) {
		console.error('Error deleting user:', userDeleteError);
		return { error: userDeleteError.message };
	}
	return { error: null };
}

export function getAgreementIds(student: StudentWithAgreements): string[] {
	return student.agreements.map((a) => a.id);
}

export function formatAgreementCount(count: number): string {
	return `${count} lesovereenkomst${count === 1 ? '' : 'en'}`;
}

export function getStudentActiveStatusLabel(activeAgreementsCount: number): 'Actief' | 'Inactief' {
	return activeAgreementsCount > 0 ? 'Actief' : 'Inactief';
}

export function formatSignupRequestCount(count: number): string {
	return `${count} ${count === 1 ? 'aanmelding' : 'aanmeldingen'}`;
}

export function formatAgreementListCount(count: number): string {
	return `${count} ${count === 1 ? 'overeenkomst' : 'overeenkomsten'}`;
}
