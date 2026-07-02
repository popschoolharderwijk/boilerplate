import { useEffect, useState } from 'react';
import { LuChevronDown, LuChevronLeft, LuMusic, LuShieldCheck, LuWallet } from 'react-icons/lu';
import { useLocation } from 'react-router-dom';
import { DevTools } from '@/components/DevTools';
import { NavItem } from '@/components/layout/NavItem';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NAV_ICONS, NAV_LABELS } from '@/config/nav-labels';
import { useAuth } from '@/hooks/useAuth';
import { useHasOwnedProjects } from '@/hooks/useHasOwnedProjects';
import { cn } from '@/lib/utils';

const NAV_GAP = '1rem';
const BEHEER_OPEN_KEY = 'sidebar:beheer-open';

// Admin-only items shown ABOVE the "Beheer" header (frequently used operations)
const adminOperationalNavItems = [
	{ href: '/agreements', label: NAV_LABELS.agreements, icon: NAV_ICONS.agreements },
	{ href: '/lesson-groups', label: NAV_LABELS.lessonGroups, icon: NAV_ICONS.lessonGroups },
	{ href: '/aanmeldingen', label: NAV_LABELS.signupRequests, icon: NAV_ICONS.signupRequests },
	{ href: '/trial-lessons', label: NAV_LABELS.trialLessons, icon: NAV_ICONS.trialLessons },
];

// Admin-only items shown UNDER the "Beheer" header (true administration)
const adminNavItems = [
	{ href: '/users', label: NAV_LABELS.users, icon: NAV_ICONS.users },
	{ href: '/lesson-types', label: NAV_LABELS.lessonTypes, icon: NAV_ICONS.lessonTypes },
	{ href: '/abonnementen', label: NAV_LABELS.subscriptions, icon: NAV_ICONS.subscriptions },
	{ href: '/incasso', label: NAV_LABELS.incasso, icon: NAV_ICONS.incasso },
	{ href: '/mandaten', label: NAV_LABELS.mandaten, icon: NAV_ICONS.mandaten },
	{ href: '/facturen', label: NAV_LABELS.invoices, icon: NAV_ICONS.invoices },
	{ href: '/boekhouding', label: NAV_LABELS.accounting, icon: NAV_ICONS.accounting },
	{ href: '/data-import', label: NAV_LABELS.dataImport, icon: NAV_ICONS.dataImport },
	{ href: '/lesvrije-periodes', label: NAV_LABELS.noLessonPeriods, icon: NAV_ICONS.noLessonPeriods },
	{ href: '/email-templates', label: NAV_LABELS.emailTemplates, icon: NAV_ICONS.emailTemplates },
	{ href: '/announcements', label: NAV_LABELS.announcements, icon: NAV_ICONS.announcements },
	{ href: '/manual', label: NAV_LABELS.manual, icon: NAV_ICONS.manual },
];

const adminHrefs = adminNavItems.map((i) => i.href);

interface SidebarProps {
	collapsed?: boolean;
	onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
	const { isAdmin, isSiteAdmin, isPrivileged, isTeacher } = useAuth();
	const isStudent = !isPrivileged && !isTeacher;
	const { hasOwnedProjects, isLoading: ownedProjectsLoading } = useHasOwnedProjects();
	const showAdminNav = isAdmin || isSiteAdmin;
	const showTeachersNav = isAdmin || isSiteAdmin;
	const showStudentsNav = isPrivileged;
	const showReportsNav = isPrivileged || isTeacher;
	const showProjectsNav =
		isAdmin || isSiteAdmin || ((isTeacher || isPrivileged) && !ownedProjectsLoading && hasOwnedProjects);

	const { pathname } = useLocation();
	const isInBeheer = adminHrefs.some((h) => pathname === h || pathname.startsWith(`${h}/`));

	// Persisted open/closed state for the Beheer group
	const [beheerOpen, setBeheerOpen] = useState<boolean>(() => {
		if (typeof window === 'undefined') return false;
		const stored = window.localStorage.getItem(BEHEER_OPEN_KEY);
		if (stored !== null) return stored === '1';
		return false;
	});

	// Auto-open when navigating into a Beheer route
	useEffect(() => {
		if (isInBeheer) setBeheerOpen(true);
	}, [isInBeheer]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		window.localStorage.setItem(BEHEER_OPEN_KEY, beheerOpen ? '1' : '0');
	}, [beheerOpen]);

	return (
		<TooltipProvider delayDuration={0}>
			<aside
				className={cn(
					'relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
					collapsed ? 'w-16' : 'w-64',
				)}
			>
				{/* Logo section */}
				<div
					className={cn(
						'flex h-16 items-center border-b border-sidebar-border',
						collapsed ? 'justify-center px-0' : 'gap-2 px-4',
					)}
				>
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
						<LuMusic className="h-5 w-5" />
					</div>
					{!collapsed && (
						<div className="flex flex-col">
							<span className="text-lg font-bold leading-tight">
								<span className="text-primary uppercase">POP</span>
								<span className="text-sidebar-foreground lowercase">school</span>
							</span>
							<span className="text-[10px] uppercase tracking-widest text-muted-foreground leading-tight mt-0.5">
								HARDERWIJK
							</span>
						</div>
					)}
					{!collapsed && (
						<Button
							variant="ghost"
							size="icon"
							className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground"
							onClick={onToggle}
						>
							<LuChevronLeft className="h-4 w-4 transition-transform" />
						</Button>
					)}
					{collapsed && (
						<Button
							variant="ghost"
							size="icon"
							className="absolute right-2 top-4 h-8 w-8 text-muted-foreground hover:text-foreground"
							onClick={onToggle}
						>
							<LuChevronLeft className="h-4 w-4 rotate-180 transition-transform" />
						</Button>
					)}
				</div>

				{/* Navigation – scrollable when content exceeds height */}
				<div className="flex-1 min-h-0 w-full overflow-hidden">
					<ScrollArea className="h-full">
						<div
							className="w-full px-2"
							style={{ paddingTop: NAV_GAP, paddingBottom: NAV_GAP } as React.CSSProperties}
						>
							<nav className="flex flex-col w-full" style={{ gap: NAV_GAP } as React.CSSProperties}>
								{/* Student-only: My Profile (top) */}
								{isStudent && (
									<>
										<NavItem
											href="/students/my-profile"
											label={NAV_LABELS.myProfile}
											icon={NAV_ICONS.myProfile}
											collapsed={collapsed}
										/>
										<NavItem
											href="/my-trial"
											label={NAV_LABELS.myTrial}
											icon={NAV_ICONS.myTrial}
											collapsed={collapsed}
										/>
										<NavItem
											href="/mijn-facturen"
											label={NAV_LABELS.myInvoices}
											icon={NAV_ICONS.myInvoices}
											collapsed={collapsed}
										/>
									</>
								)}

								{!isStudent && (
									<NavItem
										href="/"
										label={NAV_LABELS.dashboard}
										icon={NAV_ICONS.dashboard}
										collapsed={collapsed}
									/>
								)}
								<NavItem
									href="/agenda"
									label={NAV_LABELS.agenda}
									icon={NAV_ICONS.agenda}
									collapsed={collapsed}
								/>

								{showTeachersNav && (
									<NavItem
										href="/teachers"
										label={NAV_LABELS.teachers}
										icon={NAV_ICONS.teachers}
										collapsed={collapsed}
									/>
								)}

								{isTeacher && !showTeachersNav && (
									<NavItem
										href="/students/my-students"
										label={NAV_LABELS.myStudents}
										icon={NAV_ICONS.myStudents}
										collapsed={collapsed}
									/>
								)}

								{showStudentsNav && (
									<NavItem
										href="/students"
										label={NAV_LABELS.students}
										icon={NAV_ICONS.students}
										collapsed={collapsed}
									/>
								)}

								{showReportsNav && (
									<NavItem
										href="/reports"
										label={NAV_LABELS.reports}
										icon={NAV_ICONS.reports}
										collapsed={collapsed}
									/>
								)}

								{showProjectsNav && (
									<NavItem
										href="/projects"
										label={NAV_LABELS.projects}
										icon={NAV_ICONS.projects}
										collapsed={collapsed}
									/>
								)}

								{/* Admin operational items - shown above Beheer */}
								{showAdminNav &&
									adminOperationalNavItems.map((item) => (
										<NavItem key={item.href} {...item} collapsed={collapsed} />
									))}

								{showAdminNav &&
									(collapsed ? (
										<>
											<Separator />
											{adminNavItems.map((item) => (
												<NavItem key={item.href} {...item} collapsed={collapsed} />
											))}
										</>
									) : (
										<Collapsible open={beheerOpen} onOpenChange={setBeheerOpen}>
											<CollapsibleTrigger asChild>
												<button
													type="button"
													className={cn(
														'mt-4 mb-1 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors',
														'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
													)}
												>
													<LuShieldCheck className="h-3.5 w-3.5" />
													<span>Beheer</span>
													<LuChevronDown
														className={cn(
															'ml-auto h-3.5 w-3.5 transition-transform duration-200',
															beheerOpen ? 'rotate-0' : '-rotate-90',
														)}
													/>
												</button>
											</CollapsibleTrigger>
											<CollapsibleContent
												className="flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
												style={{ gap: NAV_GAP } as React.CSSProperties}
											>
												{adminNavItems.map((item) => (
													<NavItem key={item.href} {...item} collapsed={false} />
												))}
											</CollapsibleContent>
										</Collapsible>
									))}
							</nav>
						</div>
					</ScrollArea>
				</div>

				{/* Development tools */}
				<div
					className={cn(
						'border-t border-sidebar-border',
						collapsed ? 'flex justify-center p-2' : 'p-2 w-full',
					)}
				>
					<DevTools className={collapsed ? undefined : 'w-full'} collapsed={collapsed} />
				</div>
			</aside>
		</TooltipProvider>
	);
}
