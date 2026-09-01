import { getUser, verifyAccess } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export const metadata = { title: 'Student Dashboard | VVITU NSS ERP' };

export default async function StudentLayout({ children }) {
  const userCtx = await getUser();
  if (!userCtx || !userCtx.dbUser) redirect('/login');
  
  const { dbUser } = userCtx;
  const access = verifyAccess(dbUser);
  if (!access.authorized) {
    if (access.reason === 'blocked') redirect('/login?error=account-blocked');
    if (access.reason === 'pending') redirect('/pending');
  }

  if (dbUser.role !== 'STUDENT') redirect('/');

  const isCoordinator = dbUser.student?.isCoordinator;
  
  const tabs = [
    { id: 'events', name: 'Events', href: '/student/events', basePath: '/student', icon: 'Calendar' },
    { id: 'attendance', name: 'My Attendance', href: '/student/attendance', basePath: '/student/attendance', icon: 'ClipboardList' },
    { id: 'issues', name: 'Complaint Box', href: '/student/issues', basePath: '/student/issues', icon: 'AlertTriangle' },
    { id: 'documentation', name: 'Documentation', href: '/student/documentation', basePath: '/student/documentation', icon: 'BookOpen' },
    { id: 'portfolio', name: 'Portfolio', href: '/student/portfolio', basePath: '/student/portfolio', icon: 'Award' },
    { id: 'chat', name: 'Chat', href: '/student/chat', basePath: '/student/chat', icon: 'MessageSquare' },
    { id: 'announcements', name: 'Announcements', href: '/student/announcements', basePath: '/student/announcements', icon: 'Megaphone' },
    ...(isCoordinator ? [
      { id: 'volunteers', name: 'Volunteers', href: '/student/volunteers', basePath: '/student/volunteers', icon: 'ClipboardList' },
      { id: 'create-event', name: 'Post Event', href: '/student/create-event', basePath: '/student/create-event', icon: 'Calendar' },
      // Coordinator form management
      { id: 'forms', name: 'My Forms', href: '/student/forms', basePath: '/student/forms', icon: 'FileText' },
      { id: 'forms-create', name: 'Create Form', href: '/student/forms/create', basePath: '/student/forms/create', icon: 'PlusCircle' },
    ] : [
      // All students see these
      { id: 'forms-available', name: 'Available Forms', href: '/student/forms/available', basePath: '/student/forms/available', icon: 'FileText' },
      { id: 'forms-submissions', name: 'My Submissions', href: '/student/forms/my-submissions', basePath: '/student/forms/my-submissions', icon: 'ClipboardCheck' },
    ]),
    // All students always see their submissions (coordinator already has it via My Forms)
    ...(isCoordinator ? [
      { id: 'forms-available', name: 'Available Forms', href: '/student/forms/available', basePath: '/student/forms/available', icon: 'FileText' },
      { id: 'forms-submissions', name: 'My Submissions', href: '/student/forms/my-submissions', basePath: '/student/forms/my-submissions', icon: 'ClipboardCheck' },
    ] : []),
    { id: 'profile', name: 'My Profile', href: '/student/profile', basePath: '/student/profile', icon: 'UserCircle' },
  ];

  return (
    <DashboardLayout 
      dbUser={dbUser} 
      tabs={tabs}
      title={isCoordinator ? 'Coordinator Portal' : 'Volunteer Portal'}
      subtitle={`${dbUser.name} • ${dbUser.student?.department?.name || dbUser.department?.name || 'Unknown Branch'}`}
      badge={isCoordinator ? 'COORDINATOR' : null}
    >
      {children}
    </DashboardLayout>
  );
}
