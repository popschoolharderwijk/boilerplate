/**
 * Centralized type definitions for lesson groups (groepslessen).
 */

import type { Tables } from '@/integrations/supabase/types';

export type LessonGroupRow = Tables<'lesson_groups'>;
