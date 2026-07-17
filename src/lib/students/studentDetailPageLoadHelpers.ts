import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import type { SignupRequestDetail } from '@/components/students/SignupRequestDialog';
import { fetchSignupRequestsByEmail } from '@/lib/signup-requests/signupRequestMappers';
import { fetchStudentAgreementsWithRelations } from '@/lib/students/fetchStudentAgreements';
import type { StudentProfileData } from '@/lib/students/studentDetailHelpers';
import type { LessonAgreementWithTeacher } from '@/types/lesson-agreements';

export interface StudentDetailPageLoadResult {
	profile: StudentProfileData;
	agreements: LessonAgreementWithTeacher[];
	signupRequests: SignupRequestDetail[];
}

async function loadStudentProfileForDetailPage(
	supabase: SupabaseClient,
	userId: string,
): Promise<StudentProfileData | null> {
	const { data, error } = await supabase
		.from('profiles')
		.select('user_id, email, first_name, last_name, phone_number, avatar_url')
		.eq('user_id', userId)
		.maybeSingle();

	if (error || !data) return null;
	return data;
}

export async function runStudentDetailPageLoad(
	supabase: SupabaseClient,
	userId: string,
): Promise<StudentDetailPageLoadResult | null> {
	const profileData = await loadStudentProfileForDetailPage(supabase, userId);
	if (!profileData) {
		toast.error('Leerling niet gevonden');
		return null;
	}

	const [agreementsData, signupData] = await Promise.all([
		fetchStudentAgreementsWithRelations(userId),
		profileData.email ? fetchSignupRequestsByEmail(profileData.email) : Promise.resolve([]),
	]);

	return {
		profile: profileData,
		agreements: agreementsData,
		signupRequests: signupData,
	};
}
