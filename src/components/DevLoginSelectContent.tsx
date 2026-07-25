import { SelectContent, SelectItem } from '@/components/ui/select';
import { DEV_ROLES, DEV_STUDENTS, DEV_TEACHERS, DEV_USERS } from '@/lib/auth/devLoginHelpers';

export function DevLoginSelectContent() {
	return (
		<SelectContent>
			{DEV_ROLES.map((role) => (
				<SelectItem key={role.email} value={role.email}>
					{role.firstName} ({role.description})
				</SelectItem>
			))}
			<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Docenten</div>
			{DEV_TEACHERS.map((teacher) => (
				<SelectItem key={teacher.email} value={teacher.email}>
					{teacher.firstName} {teacher.description && `(${teacher.description})`}
				</SelectItem>
			))}
			<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Leerlingen</div>
			{DEV_STUDENTS.map((student) => (
				<SelectItem key={student.email} value={student.email}>
					{student.firstName} {student.description && `(${student.description})`}
				</SelectItem>
			))}
			<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
				Users (geen rol)
			</div>
			{DEV_USERS.map((user) => (
				<SelectItem key={user.email} value={user.email}>
					{user.firstName}
				</SelectItem>
			))}
		</SelectContent>
	);
}
