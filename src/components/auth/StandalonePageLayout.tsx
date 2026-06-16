import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StandaloneCenteredPageProps {
	children: ReactNode;
	narrow?: boolean;
}

export function StandaloneCenteredPage({ children, narrow = false }: StandaloneCenteredPageProps) {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className={cn('space-y-4 text-center', narrow && 'max-w-md')}>{children}</div>
		</div>
	);
}

export function StandaloneLoadingPage({ message }: { message: string }) {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="text-muted-foreground">{message}</p>
		</div>
	);
}

interface StandaloneErrorPageProps {
	title: string;
	message: string;
	actionLabel: string;
	actionHref: string;
	narrow?: boolean;
}

export function StandaloneErrorPage({
	title,
	message,
	actionLabel,
	actionHref,
	narrow = false,
}: StandaloneErrorPageProps) {
	return (
		<StandaloneCenteredPage narrow={narrow}>
			<h1 className="font-bold text-2xl text-destructive">{title}</h1>
			<p className="text-muted-foreground">{message}</p>
			<a
				href={actionHref}
				className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
			>
				{actionLabel}
			</a>
		</StandaloneCenteredPage>
	);
}
