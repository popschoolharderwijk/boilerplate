import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentInfoModalSkeletonProps {
	showPrivilegedSections: boolean;
}

export function StudentInfoModalSkeleton({ showPrivilegedSections }: StudentInfoModalSkeletonProps) {
	return (
		<div className="space-y-5 py-2">
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<Skeleton className="h-4 w-4" />
					<Skeleton className="h-4 w-28" />
				</div>
				<div className="space-y-2 pl-6">
					<div className="flex items-start gap-3">
						<Skeleton className="h-4 w-4 mt-0.5" />
						<div className="space-y-1 flex-1">
							<Skeleton className="h-3 w-12" />
							<Skeleton className="h-4 w-40" />
						</div>
					</div>
					<div className="flex items-start gap-3">
						<Skeleton className="h-4 w-4 mt-0.5" />
						<div className="space-y-1 flex-1">
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-4 w-28" />
						</div>
					</div>
				</div>
			</div>

			{showPrivilegedSections && (
				<>
					<Separator />
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-24" />
						</div>
						<div className="space-y-2 pl-6">
							<div className="space-y-1">
								<Skeleton className="h-3 w-12" />
								<Skeleton className="h-4 w-32" />
							</div>
							<div className="space-y-1">
								<Skeleton className="h-3 w-12" />
								<Skeleton className="h-4 w-36" />
							</div>
						</div>
					</div>

					<Separator />

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-32" />
						</div>
						<div className="pl-6">
							<Skeleton className="h-5 w-44" />
						</div>
					</div>

					<Separator />

					<div className="space-y-1">
						<Skeleton className="h-3 w-48" />
						<Skeleton className="h-3 w-52" />
					</div>
				</>
			)}
		</div>
	);
}
