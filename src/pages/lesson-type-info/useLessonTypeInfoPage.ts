import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { useAuth } from '@/hooks/useAuth';
import { buildLessonTypeInfoPageResult } from '@/lib/lesson-types/lessonTypeInfoPageControllerHelpers';
import {
	resolveLessonTypeInfoAccess,
	resolveLessonTypeInfoEditMode,
	resolveLessonTypeTitle,
} from '@/lib/lesson-types/lessonTypeInfoPageHelpers';
import { useLessonTypeLoader } from '@/pages/lesson-type-info/useLessonTypeLoader';
import { useLessonTypeOptionModal } from '@/pages/lesson-type-info/useLessonTypeOptionModal';
import { useLessonTypeBreadcrumb, useLessonTypeOptionsTable } from '@/pages/lesson-type-info/useLessonTypeOptionsTable';
import { useLessonTypeSubmit } from '@/pages/lesson-type-info/useLessonTypeSubmit';

export function useLessonTypeInfoPage() {
	const { id } = useParams<{ id: string }>();
	const { isAdmin, isSiteAdmin, isLoading: authLoading } = useAuth();
	const { setBreadcrumbSuffix } = useBreadcrumb();

	const isEditMode = resolveLessonTypeInfoEditMode(id);
	const hasAccess = resolveLessonTypeInfoAccess(isAdmin, isSiteAdmin);

	const loader = useLessonTypeLoader({ id, isEditMode, authLoading });
	const [saving, setSaving] = useState(false);

	const optionsTable = useLessonTypeOptionsTable({
		optionsForm: loader.optionsForm,
		setOptionsForm: loader.setOptionsForm,
	});

	const optionModal = useLessonTypeOptionModal({
		isEditMode,
		lessonType: loader.lessonType,
		optionsForm: loader.optionsForm,
		setOptionsForm: loader.setOptionsForm,
		setOptions: loader.setOptions,
		findOptionIndex: optionsTable.findOptionIndex,
		removeOption: optionsTable.removeOption,
		setSaving,
	});

	const submit = useLessonTypeSubmit({
		isEditMode,
		lessonType: loader.lessonType,
		form: loader.form,
		optionsForm: loader.optionsForm,
		options: loader.options,
		setSaving,
		saving,
	});

	useLessonTypeBreadcrumb(isEditMode, loader.lessonType?.name, setBreadcrumbSuffix);

	const lessonTypeTitle = useMemo(
		() => resolveLessonTypeTitle(loader.form.name, isEditMode, loader.lessonType?.name),
		[isEditMode, loader.form.name, loader.lessonType?.name],
	);

	return buildLessonTypeInfoPageResult({
		authLoading,
		hasAccess,
		isEditMode,
		id,
		loading: loader.loading,
		lessonType: loader.lessonType,
		form: loader.form,
		setForm: loader.setForm,
		sortedOptionsForm: optionsTable.sortedOptionsForm,
		optionColumns: optionsTable.optionColumns,
		getOptionRowKey: optionsTable.getOptionRowKey,
		lessonTypeTitle,
		saving,
		submit,
		optionModal,
	});
}
