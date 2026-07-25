import { LuTrash2 } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserSelectSingle } from '@/components/ui/user-select';

interface ReportsTeacherFilterProps {
	selectedTeacherUserId: string;
	onTeacherChange: (userId: string) => void;
}

export function ReportsTeacherFilter({ selectedTeacherUserId, onTeacherChange }: ReportsTeacherFilterProps) {
	return (
		<div className="flex flex-wrap items-end gap-4">
			<div className="space-y-1.5 min-w-[280px]">
				<Label>Docent</Label>
				<div className="flex items-center gap-2">
					<UserSelectSingle
						filter="teachers"
						value={selectedTeacherUserId === 'all' ? null : selectedTeacherUserId}
						onChange={(user) => onTeacherChange(user?.user_id ?? 'all')}
						placeholder="Alle docenten"
					/>
					{selectedTeacherUserId !== 'all' && (
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={() => onTeacherChange('all')}
							className="h-10 w-10 flex-shrink-0"
							title="Selectie wissen"
						>
							<LuTrash2 className="h-4 w-4 text-muted-foreground" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
