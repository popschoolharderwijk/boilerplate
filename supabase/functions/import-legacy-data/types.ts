export const TABS = ['lesson_types', 'lesson_type_options', 'teachers', 'students', 'lesson_agreements'] as const;
export type Tab = (typeof TABS)[number];

export interface RowError {
	tab: Tab;
	row: number;
	field?: string;
	message: string;
}

export interface ImportSummary {
	tab: Tab;
	created: number;
	updated: number;
	failed: number;
}

export interface TeacherImportRow {
	legacy_id: string;
	email: string;
	first_name?: string | null;
	last_name?: string | null;
	phone_number?: string | null;
	bio?: string | null;
	is_active?: boolean;
	lesson_type_legacy_ids?: string | null;
}

export interface StudentImportRow {
	legacy_id: string;
	email: string;
	first_name?: string | null;
	last_name?: string | null;
	phone_number?: string | null;
	date_of_birth?: string | null;
	parent_name?: string | null;
	parent_email?: string | null;
	parent_phone_number?: string | null;
	debtor_info_same_as_student?: boolean;
	debtor_name?: string | null;
	debtor_address?: string | null;
	debtor_postal_code?: string | null;
	debtor_city?: string | null;
}

export type LegacyImportAction = 'template' | 'validate' | 'import';

export interface LegacyImportBody {
	action: LegacyImportAction;
	file_base64?: string;
}
