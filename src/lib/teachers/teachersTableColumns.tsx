import { Badge } from '@/components/ui/badge';
import type { DataTableColumn } from '@/components/ui/data-table';
import { LessonTypeBadge } from '@/components/ui/lesson-type-badge';
import { UserDisplay } from '@/components/ui/user-display';
import { formatDateTimeShort } from '@/lib/date/date-format';
import type { TeacherWithLessonTypes } from '@/types/teachers';

export function buildTeachersColumns(): DataTableColumn<TeacherWithLessonTypes>[] {
	return [
		{
			key: 'teacher',
			label: 'Docent',
			sortable: true,
			render: (t) => <UserDisplay profile={t} showEmail />,
		},
		{
			key: 'phone_number',
			label: 'Telefoonnummer',
			sortable: true,
			render: (t) => <span className="text-muted-foreground">{t.phone_number || '-'}</span>,
			className: 'text-muted-foreground',
		},
		{
			key: 'lesson_types',
			label: 'Lessoorten',
			sortable: false,
			render: (t) => {
				if (t.lesson_types.length === 0) {
					return <span className="text-muted-foreground text-sm">-</span>;
				}
				return (
					<div className="flex items-center gap-1.5">
						{t.lesson_types.map((lt) => (
							<LessonTypeBadge key={lt.id} lessonType={lt} showName={false} />
						))}
					</div>
				);
			},
		},
		{
			key: 'is_active',
			label: 'Status',
			sortable: true,
			render: (t) => (
				<Badge variant={t.is_active ? 'default' : 'secondary'}>{t.is_active ? 'Actief' : 'Inactief'}</Badge>
			),
		},
		{
			key: 'created_at',
			label: 'Aangemaakt',
			sortable: true,
			render: (t) => <span className="text-muted-foreground">{formatDateTimeShort(new Date(t.created_at))}</span>,
			className: 'text-muted-foreground',
		},
	];
}
