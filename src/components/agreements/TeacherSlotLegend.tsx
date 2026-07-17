import { LuCircleCheck, LuCircleX, LuTriangleAlert } from 'react-icons/lu';

export function TeacherSlotLegend() {
	return (
		<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
			<span className="inline-flex items-center gap-1">
				<LuCircleCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" aria-hidden />
				Vrij
			</span>
			<span className="inline-flex items-center gap-1">
				<LuTriangleAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
				Deels bezet
			</span>
			<span className="inline-flex items-center gap-1">
				<LuCircleX className="h-3.5 w-3.5 text-muted-foreground opacity-70" aria-hidden />
				Bezet
			</span>
		</div>
	);
}
