import { getUser, verifyAccess } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export const metadata = { title: 'Faculty Dashboard | VVITU NSS ERP' };

export default async function FacultyLayout({ children }) {
  const userCtx = await getUser();
  if (!userCtx || !userCtx.dbUser) redirect('/login');
  
  const { dbUser } = userCtx;
  const access = verifyAccess(dbUser);
  if (!access.authorized) {
    if (access.reason === 'blocked') redirect('/login?error=account-blocked');
    if (access.reason === 'pending') redirect('/pending');
  }

  if (dbUser.role !== 'FACULTY' && dbUser.role !== 'ADMIN') redirect('/');

  const tabs = [
    { id: 'branch', name: 'My Branch', href: '/faculty/branch', basePath: '/faculty', icon: 'Users' },
    { id: 'monitoring', name: 'AY Monitoring', href: '/faculty/monitoring', basePath: '/faculty/monitoring', icon: 'TrendingUp' },
    { id: 'villages', name: 'Village Reports', href: '/faculty/villages', basePath: '/faculty/villages', icon: 'MapPin' },
    { id: 'events', name: 'Events', href: '/faculty/events', basePath: '/faculty/events', icon: 'Calendar' },
    { id: 'attendance', name: 'Attendance', href: '/faculty/attendance', basePath: '/faculty/attendance', icon: 'ClipboardList' },
    { id: 'finance', name: 'Finance & Audit', href: '/faculty/finance', basePath: '/faculty/finance', icon: 'Award' },
    { id: 'documentation', name: 'Documentation', href: '/faculty/documentation', basePath: '/faculty/documentation', icon: 'BookOpen' },
    { id: 'backup', name: 'Backup Hub', href: '/faculty/backup', basePath: '/faculty/backup', icon: 'Download' },
    { id: 'chat', name: 'Chat', href: '/faculty/chat', basePath: '/faculty/chat', icon: 'MessageSquare' },
    { id: 'announcements', name: 'Announcements', href: '/faculty/announcements', basePath: '/faculty/announcements', icon: 'Megaphone' },
    // ── Forms ──────────────────────────────────────────────
    { id: 'forms', name: 'My Forms', href: '/faculty/forms', basePath: '/faculty/forms', icon: 'FileText' },
    { id: 'forms-create', name: 'Create Form', href: '/faculty/forms/create', basePath: '/faculty/forms/create', icon: 'PlusCircle' },
    { id: 'forms-drafts', name: 'Drafts', href: '/faculty/forms/drafts', basePath: '/faculty/forms/drafts', icon: 'Inbox' },
    { id: 'forms-published', name: 'Published', href: '/faculty/forms/published', basePath: '/faculty/forms/published', icon: 'Send' },
    { id: 'forms-closed', name: 'Closed', href: '/faculty/forms/closed', basePath: '/faculty/forms/closed', icon: 'CheckSquare' },
    // ───────────────────────────────────────────────────────
    { id: 'profile', name: 'My Profile', href: '/faculty/profile', basePath: '/faculty/profile', icon: 'UserCircle' },
  ];

  return (
    <DashboardLayout 
      dbUser={dbUser} 
      tabs={tabs}
      title="Faculty Portal"
      subtitle={`${dbUser.faculty?.department?.name || 'No branch assigned'} • ${dbUser.name}`}
    >
      {children}
    </DashboardLayout>
  );
}
