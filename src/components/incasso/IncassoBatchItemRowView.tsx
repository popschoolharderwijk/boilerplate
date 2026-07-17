import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { IncassoBatchItemRow } from '@/lib/incasso/incassoBatchDetailHelpers';
import { formatBatchItemStudentName } from '@/lib/incasso/incassoBatchDetailHelpers';
import { type BatchItemStatus, formatCentsEUR, ITEM_STATUS_LABELS } from '@/lib/incasso/types';

interface IncassoBatchItemRowViewProps {
	item: IncassoBatchItemRow;
	itemStatusEditable: boolean;
	onUpdateItemStatus: (itemId: string, status: BatchItemStatus) => void;
}

export function IncassoBatchItemRowView({
	item,
	itemStatusEditable,
	onUpdateItemStatus,
}: IncassoBatchItemRowViewProps) {
	return (
		<tr className="border-t">
			<td className="p-3">{formatBatchItemStudentName(item.profiles)}</td>
			<td className="p-3">{item.remittance_info}</td>
			<td className="p-3">
				<Badge variant="outline">{item.sequence_type}</Badge>
			</td>
			<td className="p-3 text-right">{formatCentsEUR(item.amount_cents)}</td>
			<td className="p-3">
				{itemStatusEditable ? (
					<Select
						value={item.status}
						onValueChange={(value) => onUpdateItemStatus(item.id, value as BatchItemStatus)}
					>
						<SelectTrigger className="h-8 w-36">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{(Object.keys(ITEM_STATUS_LABELS) as BatchItemStatus[]).map((status) => (
								<SelectItem key={status} value={status}>
									{ITEM_STATUS_LABELS[status]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<Badge variant="secondary">{ITEM_STATUS_LABELS[item.status]}</Badge>
				)}
			</td>
		</tr>
	);
}
