import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ParentContactInfo } from '@/lib/students/myStudentProfileHelpers';

interface ParentContactCardProps {
	student: ParentContactInfo;
}

export function ParentContactCard({ student }: ParentContactCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Ouder/voogd gegevens</CardTitle>
				<CardDescription>Contactgegevens van ouder/voogd</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				{student.parent_name && (
					<div>
						<p className="text-sm font-medium text-muted-foreground">Naam</p>
						<p className="text-sm">{student.parent_name}</p>
					</div>
				)}
				{student.parent_email && (
					<div>
						<p className="text-sm font-medium text-muted-foreground">E-mail</p>
						<p className="text-sm">{student.parent_email}</p>
					</div>
				)}
				{student.parent_phone_number && (
					<div>
						<p className="text-sm font-medium text-muted-foreground">Telefoonnummer</p>
						<p className="text-sm">{student.parent_phone_number}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
