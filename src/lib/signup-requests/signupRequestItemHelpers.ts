import type { SignupRequestDetail } from '@/components/students/SignupRequestDialog';

export type SignupRequestBadgeVariant = 'default' | 'secondary' | 'outline';

export function resolveSignupRequestBadgeVariant(status: SignupRequestDetail['status']): SignupRequestBadgeVariant {
	if (status === 'pending') return 'default';
	if (status === 'approved') return 'secondary';
	return 'outline';
}
