import { applyGroupMemberSync } from '@/components/lesson-groups/wizard/lessonGroupMemberSyncHelpers';
import {
	approveSelectedSignupRequests,
	buildLessonGroupDbPayload,
	normalizeLessonGroupStartTime,
	persistLessonGroupRecord,
	scheduleLessonGroupInAgenda,
} from '@/components/lesson-groups/wizard/lessonGroupSaveHelpers';
import type { LessonGroupFormState } from '@/components/lesson-groups/wizard/lessonGroupWizardTypes';
import { supabase } from '@/integrations/supabase/client';
import type { SlotWithStatus } from '@/lib/agreementSlots';

interface SaveLessonGroupParams {
	form: LessonGroupFormState;
	slot: SlotWithStatus;
	isEditMode: boolean;
	groupId: string | undefined;
}

async function syncLessonGroupMembers(groupId: string, memberIds: string[], requestIds: string[]): Promise<void> {
	await applyGroupMemberSync(supabase, groupId, memberIds);
	await approveSelectedSignupRequests(supabase, groupId, requestIds);
}

async function maybeScheduleNewLessonGroup(
	isEditMode: boolean,
	scheduleInAgenda: boolean,
	groupId: string,
	form: LessonGroupFormState,
	slot: SlotWithStatus,
	startTime: string,
): Promise<void> {
	if (isEditMode || !scheduleInAgenda || !form.teacherUserId) return;
	await scheduleLessonGroupInAgenda(supabase, groupId, form, slot, startTime, form.teacherUserId);
}

export async function saveLessonGroup(params: SaveLessonGroupParams): Promise<string> {
	const { form, slot, isEditMode, groupId } = params;
	if (!form.lessonTypeId || !form.teacherUserId) {
		throw new Error('Missing required lesson group fields');
	}

	const startTime = normalizeLessonGroupStartTime(slot.start_time);
	const payload = buildLessonGroupDbPayload(form, slot, startTime);
	const savedGroupId = await persistLessonGroupRecord(supabase, isEditMode, groupId, payload);

	await syncLessonGroupMembers(savedGroupId, form.memberIds, form.selectedRequestIds);
	await maybeScheduleNewLessonGroup(isEditMode, form.scheduleInAgenda, savedGroupId, form, slot, startTime);

	return savedGroupId;
}
