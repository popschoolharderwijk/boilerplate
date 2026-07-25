import { DevToolsRoot } from '@/components/DevToolsParts';

/**
 * Development tools component.
 * Contains dev login and environment badge.
 * When collapsed=true shows a single icon that opens a dropdown (for collapsed sidebar).
 * When sidebar is expanded, the dev block is collapsible. defaultOpen: login page expanded, other pages collapsed.
 * This component is completely removed from production builds via dead-code elimination.
 */
export function DevTools({
	className,
	collapsed,
	defaultOpen = false,
}: {
	className?: string;
	collapsed?: boolean;
	defaultOpen?: boolean;
}) {
	return <DevToolsRoot className={className} collapsed={collapsed} defaultOpen={defaultOpen} />;
}
