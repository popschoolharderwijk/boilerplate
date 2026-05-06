/**
 * Centralized type definitions for lesson groups (groepslessen).
 */

import type { Insert, Update } from '@/integrations/supabase/insert-helpers';
import type { Tables } from '@/integrations/supabase/types';
import type { LessonTypeDisplayFields } from '@/types/lesson-agreements';
import type { User } from '@/types/users';

export type LessonGroupRow = Tables<'lesson_groups'>;
export type LessonGroupInsert = Insert<'lesson_groups'>;
export type LessonGroupUpdate = Update<'lesson_groups'>;

export type LessonGroupMemberRow = Tables<'lesson_group_members'>;
export type LessonGroupMemberInsert = Insert<'lesson_group_members'>;

export type LessonGroupWithRelations = LessonGroupRow & {
	lesson_type: LessonTypeDisplayFields | null;
	teacher: Pick<User, 'first_name' | 'last_name' | 'avatar_url' | 'email'> | null;
	members_count?: number;
};
