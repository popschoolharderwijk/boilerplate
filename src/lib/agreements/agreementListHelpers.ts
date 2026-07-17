import type { AgreementTableRow } from '@/types/lesson-agreements';

export function filterAgreementRows(rows: AgreementTableRow[], search: string): AgreementTableRow[] {
	if (!search) return rows;
	const q = search.toLowerCase();
	const filtered: AgreementTableRow[] = [];
	for (const row of rows) {
		const studentName = `${row.student.first_name ?? ''} ${row.student.last_name ?? ''}`.toLowerCase();
		const teacherName = `${row.teacher.first_name ?? ''} ${row.teacher.last_name ?? ''}`.toLowerCase();
		const matches =
			studentName.includes(q) ||
			teacherName.includes(q) ||
			row.lesson_type.name.toLowerCase().includes(q) ||
			(row.student.email ?? '').toLowerCase().includes(q);
		if (matches) filtered.push(row);
	}
	return filtered;
}

function sortAgreementRowsByProfile(
	rows: AgreementTableRow[],
	sortColumn: 'student' | 'teacher',
	sortDirection: 'asc' | 'desc' | null,
): AgreementTableRow[] {
	const sorted = [...rows];
	const asc = sortDirection === 'asc';
	sorted.sort((a, b) => {
		const profileA = sortColumn === 'student' ? a.student : a.teacher;
		const profileB = sortColumn === 'student' ? b.student : b.teacher;
		const aName = `${profileA.first_name ?? ''} ${profileA.last_name ?? ''}`.toLowerCase();
		const bName = `${profileB.first_name ?? ''} ${profileB.last_name ?? ''}`.toLowerCase();
		return asc ? aName.localeCompare(bName) : bName.localeCompare(aName);
	});
	return sorted;
}

export function sortAgreementRows(
	rows: AgreementTableRow[],
	sortColumn: string | null,
	sortDirection: 'asc' | 'desc' | null,
): AgreementTableRow[] {
	if (sortColumn === 'student' || sortColumn === 'teacher') {
		return sortAgreementRowsByProfile(rows, sortColumn, sortDirection);
	}
	return rows;
}
