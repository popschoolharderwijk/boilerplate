interface PageHeaderProps {
	/** Main heading (e.g. page title, entity name). */
	title: React.ReactNode;
	/** Optional icon/avatar on the left (caller supplies h-16 w-16). */
	icon?: React.ReactNode;
	/** Optional line below the title (e.g. description, email). */
	subtitle?: React.ReactNode;
	/** Optional action buttons on the right. */
	actions?: React.ReactNode;
}

export function PageHeader({ title, icon, subtitle, actions }: PageHeaderProps) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div className="flex items-center gap-4">
				{icon != null && icon}
				<div>
					<h1 className="text-2xl font-semibold leading-none tracking-tight">{title}</h1>
					{subtitle != null && subtitle !== '' && (
						<p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
					)}
				</div>
			</div>
			{actions != null && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}
