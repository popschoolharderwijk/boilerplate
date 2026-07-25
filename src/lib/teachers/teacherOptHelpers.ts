export interface TeacherProfileFields {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	avatar_url: string | null;
}

export interface TeacherOptFields {
	id: string;
	userId: string;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	avatarUrl: string | null;
}

function buildTeacherOpt(userId: string, profile: TeacherProfileFields | undefined): TeacherOptFields {
	return {
		id: userId,
		userId,
		firstName: profile?.first_name ?? null,
		lastName: profile?.last_name ?? null,
		email: profile?.email ?? null,
		avatarUrl: profile?.avatar_url ?? null,
	};
}

export function buildTeacherOptsFromActives(
	actives: { user_id: string }[],
	profiles: TeacherProfileFields[],
): TeacherOptFields[] {
	const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile]));
	const teachers: TeacherOptFields[] = [];
	for (const teacher of actives) {
		teachers.push(buildTeacherOpt(teacher.user_id, profileMap.get(teacher.user_id)));
	}
	return teachers;
}

function isBookingInDateRange(
	row: { start_date: string; end_date: string | null },
	startDate: string,
	endDate: string,
): boolean {
	return row.start_date <= endDate && (row.end_date === null || row.end_date >= startDate);
}

export function filterRowsInDateRange<T extends { start_date: string; end_date: string | null }>(
	rows: T[],
	startDate: string,
	endDate: string,
): T[] {
	const filtered: T[] = [];
	for (const row of rows) {
		if (isBookingInDateRange(row, startDate, endDate)) {
			filtered.push(row);
		}
	}
	return filtered;
}
