import { AdminSiteGuard } from '@/components/auth/AdminSiteGuard';
import { IncassoBatchDetailContent } from '@/components/incasso/IncassoBatchDetailContent';
import { useIncassoBatchDetail } from '@/hooks/useIncassoBatchDetail';
import { resolveIncassoBatchDetailView } from '@/lib/incasso/incassoBatchDetailHelpers';

export default function IncassoBatchDetail() {
	return (
		<AdminSiteGuard>
			<Detail />
		</AdminSiteGuard>
	);
}

function Detail() {
	const detail = useIncassoBatchDetail();
	const view = resolveIncassoBatchDetailView(detail.loading, detail.batch);

	if (view === 'loading') {
		return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
	}

	if (view === 'not-found' || !detail.batch) {
		return <div className="p-8 text-center text-muted-foreground">Batch niet gevonden</div>;
	}

	return (
		<IncassoBatchDetailContent
			batch={detail.batch}
			items={detail.items}
			busy={detail.busy}
			itemStatusEditable={detail.itemStatusEditable}
			onBuild={() => {
				void detail.handleBuild();
			}}
			onApprove={() => {
				void detail.handleApprove();
			}}
			onGenerateXml={() => {
				void detail.handleGenerateXml();
			}}
			onClose={() => {
				void detail.handleClose();
			}}
			onDownloadXml={(path) => {
				void detail.downloadXml(path);
			}}
			onUpdateItemStatus={(itemId, status) => {
				void detail.handleUpdateItemStatus(itemId, status);
			}}
		/>
	);
}
