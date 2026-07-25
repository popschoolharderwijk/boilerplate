export interface Body {
	xml?: string;
	batch_id?: string;
}

export interface TxResult {
	end_to_end_id: string;
	status: 'accepted' | 'rejected' | 'submitted';
	reason_code: string | null;
}

export interface ParsedReport {
	message_id: string | null;
	original_message_id: string | null;
	group_status: string | null;
	transactions: TxResult[];
}

export interface BatchRow {
	id: string;
	message_id: string | null;
	status: string;
}

export interface BatchItemRow {
	id: string;
	end_to_end_id: string;
	mandate_id: string;
	status: string;
	sequence_type: string;
}

export interface ApplyReportResult {
	acceptedCount: number;
	rejectedCount: number;
	unknown: string[];
	mandatesPromoted: number;
	batchClosed: boolean;
}
