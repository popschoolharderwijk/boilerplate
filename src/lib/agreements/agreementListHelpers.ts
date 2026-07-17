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

function getAgreementRowProfileName(row: AgreementTableRow, sortColumn: 'student' | 'teacher'): string {
	const profile = sortColumn === 'student' ? row.student : row.teacher;
	return `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.toLowerCase();
}

function compareAgreementRowsByProfile(
	a: AgreementTableRow,
	b: AgreementTableRow,
	sortColumn: 'student' | 'teacher',
	sortDirection: 'asc' | 'desc' | null,
): number {
	const aName = getAgreementRowProfileName(a, sortColumn);
	const bName = getAgreementRowProfileName(b, sortColumn);
	const asc = sortDirection === 'asc';
	return asc ? aName.localeCompare(bName) : bName.localeCompare(aName);
}

function sortAgreementRowsByProfile(
	rows: AgreementTableRow[],
	sortColumn: 'student' | 'teacher',
	sortDirection: 'asc' | 'desc' | null,
): AgreementTableRow[] {
	const sorted = [...rows];
	function compareRows(a: AgreementTableRow, b: AgreementTableRow): number {
		return compareAgreementRowsByProfile(a, b, sortColumn, sortDirection);
	}
	sorted.sort(compareRows);
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
