import { getUser, verifyAccess } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, Calendar, MessageSquare, Megaphone, UserCircle } from 'lucide-react';

export const metadata = { title: 'Faculty Dashboard | Student Attendance Management Portal' };

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
    { id: 'events', name: 'Events', href: '/faculty/events', basePath: '/faculty/events', icon: 'Calendar' },
    { id: 'finance', name: 'Finance', href: '/faculty/finance', basePath: '/faculty/finance', icon: 'Award' },
    { id: 'documentation', name: 'Documentation', href: '/faculty/documentation', basePath: '/faculty/documentation', icon: 'BookOpen' },
    { id: 'backup', name: 'Backup Hub', href: '/faculty/backup', basePath: '/faculty/backup', icon: 'Download' },
    { id: 'chat', name: 'Chat', href: '/faculty/chat', basePath: '/faculty/chat', icon: 'MessageSquare' },
    { id: 'announcements', name: 'Announcements', href: '/faculty/announcements', basePath: '/faculty/announcements', icon: 'Megaphone' },
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
