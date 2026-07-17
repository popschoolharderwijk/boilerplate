import { MyStudentProfileViewSwitch } from '@/components/students/MyStudentProfileViewSwitch';
import { useMyStudentProfilePage } from '@/hooks/useMyStudentProfilePage';
import {
	resolveMyStudentProfileView,
	shouldRedirectMissingStudentProfile,
} from '@/lib/students/myStudentProfileHelpers';

export default function MyStudentProfile() {
	const { user, authLoading, loading, profile, agreements, signupRequests } = useMyStudentProfilePage();

	const view = resolveMyStudentProfileView({
		authLoading,
		loading,
		profile,
		redirectMissing: shouldRedirectMissingStudentProfile({
			authLoading,
			user,
			profileLoaded: Boolean(profile),
			loading,
		}),
	});

	return (
		<MyStudentProfileViewSwitch
			view={view}
			profile={profile}
			agreements={agreements}
			signupRequests={signupRequests}
		/>
	);
}
