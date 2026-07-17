import { LuLoaderCircle } from 'react-icons/lu';
import { Navigate } from 'react-router-dom';
import { ColorIcon } from '@/components/ui/color-icon';
import { resolveIconFromList } from '@/components/ui/icon-picker';
import { PageHeader } from '@/components/ui/page-header';
import { MUSIC_ICONS } from '@/constants/icons';
import { resolveLessonTypeInfoViewState } from '@/lib/lesson-types/lessonTypeInfoPageHelpers';
import { LessonTypeFormCard } from '@/pages/lesson-type-info/LessonTypeFormCard';
import { LessonTypeOptionsPanel } from '@/pages/lesson-type-info/LessonTypeOptionsPanel';
import { useLessonTypeInfoPage } from '@/pages/lesson-type-info/useLessonTypeInfoPage';

function LessonTypeInfoPageIcon({ iconName, color }: { iconName?: string; color?: string | null }) {
	return (
		<ColorIcon
			icon={iconName ? resolveIconFromList(MUSIC_ICONS, iconName) : undefined}
			color={color || null}
			size="lg"
			className="h-16 w-16 [&_svg]:h-8 [&_svg]:w-8"
		/>
	);
}

export default function LessonTypeInfo() {
	const vm = useLessonTypeInfoPage();
	const viewState = resolveLessonTypeInfoViewState({
		authLoading: vm.authLoading,
		hasAccess: vm.hasAccess,
		isEditMode: vm.isEditMode,
		loading: vm.loading,
		id: vm.id,
		hasLessonType: Boolean(vm.lessonType),
	});

	if (viewState === 'redirect') {
		return <Navigate to="/" replace />;
	}

	if (viewState === 'loading') {
		return (
			<div className="flex items-center justify-center py-12">
				<LuLoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				icon={<LessonTypeInfoPageIcon iconName={vm.form.icon} color={vm.form.color} />}
				title={vm.lessonTypeTitle}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="min-w-0">
					<LessonTypeFormCard
						form={vm.form}
						setForm={vm.setForm}
						onSubmit={vm.submit.handleSubmit}
						canSubmit={vm.submit.canSubmit}
						submitting={vm.saving}
						submitLabel={vm.submit.submitLabel}
						savingLabel={vm.submit.savingLabel}
					/>
				</div>

				<div className="min-w-0">
					<LessonTypeOptionsPanel
						sortedOptionsForm={vm.sortedOptionsForm}
						optionColumns={vm.optionColumns}
						getOptionRowKey={vm.getOptionRowKey}
						onAddOption={vm.optionModal.addOption}
						onEditOption={vm.optionModal.setEditingOption}
						onDeleteOption={vm.optionModal.setOptionToDelete}
						editingOption={vm.optionModal.editingOption}
						onCloseEditModal={() => vm.optionModal.setEditingOption(null)}
						optionModalForm={vm.optionModal.optionModalForm}
						setOptionModalForm={vm.optionModal.setOptionModalForm}
						onSaveOption={vm.optionModal.saveOptionInModal}
						optionToDelete={vm.optionModal.optionToDelete}
						onCloseDeleteDialog={() => vm.optionModal.setOptionToDelete(null)}
						onConfirmDelete={vm.optionModal.confirmRemoveOption}
						saving={vm.saving}
					/>
				</div>
			</div>
		</div>
	);
}
