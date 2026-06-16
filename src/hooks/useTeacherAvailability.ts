import { useCallback, useEffect, useState } from 'react';
import { fetchTeacherAvailability, type TeacherAvailability } from '@/lib/teachers/teacherAvailabilityApi';

export function useTeacherAvailability(teacherUserId: string | null | undefined, enabled = true) {
	const [availability, setAvailability] = useState<TeacherAvailability[]>([]);
	const [loading, setLoading] = useState(true);

	const loadAvailability = useCallback(async () => {
		if (!enabled || !teacherUserId) return;

		setLoading(true);

		const result = await fetchTeacherAvailability(teacherUserId);
		if (result.error) {
			setLoading(false);
			return;
		}

		setAvailability(result.data);
		setLoading(false);
	}, [enabled, teacherUserId]);

	useEffect(() => {
		if (enabled) {
			void loadAvailability();
		}
	}, [enabled, loadAvailability]);

	return { availability, loading, loadAvailability };
}
