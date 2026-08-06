import { getUser, verifyAccess } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  LayoutDashboard, Users, Calendar, AlertTriangle, MessageSquare, Megaphone,
  GraduationCap, BookOpen, UserCircle, Quote, Activity, Award
} from 'lucide-react';


export const metadata = { title: 'Admin Dashboard | VVITU NSS ERP' };

export default async function AdminLayout({ children }) {
  const userCtx = await getUser();
  if (!userCtx || !userCtx.dbUser) redirect('/login');
  
  const { dbUser } = userCtx;
  const access = verifyAccess(dbUser);
  if (!access.authorized) {
    if (access.reason === 'blocked') redirect('/login?error=account-blocked');
    if (access.reason === 'pending') redirect('/pending');
  }

  if (dbUser.role !== 'ADMIN') redirect('/');

  const tabs = [
    { id: 'overview', name: 'Overview', href: '/admin/overview', basePath: '/admin', icon: 'LayoutDashboard' },
    { id: 'approvals', name: 'Approvals', href: '/admin/approvals', basePath: '/admin/approvals', icon: 'UserCheck' },
    { id: 'volunteers', name: 'Volunteers', href: '/admin/volunteers', basePath: '/admin/volunteers', icon: 'Users' },
    { id: 'faculty', name: 'Faculty', href: '/admin/faculty', basePath: '/admin/faculty', icon: 'GraduationCap' },
    { id: 'faculty-desk', name: 'Faculty Desk', href: '/admin/faculty-desk', basePath: '/admin/faculty-desk', icon: 'Award' },
    { id: 'events', name: 'Events', href: '/admin/events', basePath: '/admin/events', icon: 'Calendar' },
    { id: 'attendance', name: 'Attendance', href: '/admin/attendance', basePath: '/admin/attendance', icon: 'ClipboardList' },
    { id: 'finance', name: 'Finance', href: '/admin/finance', basePath: '/admin/finance', icon: 'Award' },
    { id: 'documentation', name: 'Documentation', href: '/admin/documentation', basePath: '/admin/documentation', icon: 'BookOpen' },
    { id: 'backup', name: 'Backup Hub', href: '/admin/backup', basePath: '/admin/backup', icon: 'Download' },
    { id: 'issues', name: 'Issues & Complaints', href: '/admin/issues', basePath: '/admin/issues', icon: 'AlertTriangle' },
    { id: 'chat', name: 'Chat', href: '/admin/chat', basePath: '/admin/chat', icon: 'MessageSquare' },
    { id: 'announcements', name: 'Announcements', href: '/admin/announcements', basePath: '/admin/announcements', icon: 'Megaphone' },
    { id: 'testimonials', name: 'Testimonials', href: '/admin/testimonials', basePath: '/admin/testimonials', icon: 'Quote' },
    { id: 'campaign-widget', name: 'Campaign Widget', href: '/admin/campaign-widget', basePath: '/admin/campaign-widget', icon: 'Activity' },
    { id: 'branches', name: 'Branches', href: '/admin/branches', basePath: '/admin/branches', icon: 'BookOpen' },
    { id: 'profile', name: 'Profile', href: '/admin/profile', basePath: '/admin/profile', icon: 'UserCircle' },
  ];

  return (
    <DashboardLayout 
      dbUser={dbUser} 
      tabs={tabs}
      title="Portal Admin"
      subtitle={dbUser.email}
    >
      {children}
    </DashboardLayout>
  );
}
