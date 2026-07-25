import { StudentInfoModalBody } from '@/components/students/StudentInfoModalBody';
import { StudentInfoModalHeader } from '@/components/students/StudentInfoModalHeader';
import { StudentInfoModalSkeleton } from '@/components/students/StudentInfoModalSkeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { getUserInitials } from '@/components/ui/user-display';
import { useAuth } from '@/hooks/useAuth';
import { useStudentInfoModal } from '@/hooks/useStudentInfoModal';
import type { User } from '@/types/users';

interface StudentInfoModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Initial student data (name/email/avatar) - modal will load full details */
	student: User | null;
}

export function StudentInfoModal({ open, onOpenChange, student }: StudentInfoModalProps) {
	const { isPrivileged } = useAuth();
	const modalData = useStudentInfoModal(open, student, isPrivileged);

	if (!student || !modalData) return null;

	const { display, displayName, fullData, loading } = modalData;
	const initials = getUserInitials(display);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<StudentInfoModalHeader
					displayName={displayName}
					email={display.email}
					avatarUrl={display.avatar_url}
					initials={initials}
				/>
				<Separator />
				{loading ? (
					<StudentInfoModalSkeleton showPrivilegedSections={isPrivileged} />
				) : (
					<StudentInfoModalBody display={display} fullData={fullData} canViewFullData={isPrivileged} />
				)}
			</DialogContent>
		</Dialog>
	);
}
