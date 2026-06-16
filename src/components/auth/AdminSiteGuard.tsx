import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useAuth } from '@/hooks/useAuth';

interface AdminSiteGuardProps {
	children: ReactNode;
}

export function AdminSiteGuard({ children }: AdminSiteGuardProps) {
	const { isAdmin, isSiteAdmin, isLoading } = useAuth();
	const hasAccess = isAdmin || isSiteAdmin;

	if (isLoading) return <PageSkeleton variant="header-and-cards" />;
	if (!hasAccess) return <Navigate to="/" replace />;

	return children;
}
