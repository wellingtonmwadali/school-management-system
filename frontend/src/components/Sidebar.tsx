'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import {
  LayoutDashboard, Users, UserCheck, BookOpen, DollarSign, Calendar,
  ClipboardList, Heart, Library, Bus, Home, Bell, Settings,
  FileText, Shield, MessageSquare, LogOut, GraduationCap, Stethoscope,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from './ui/badge';
import { getInitials, getRoleLabel } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  {
    label: 'Students', href: '/students', icon: <GraduationCap size={18} />,
    roles: ['principal', 'deputy_principal', 'hod', 'class_teacher', 'subject_teacher', 'counselor', 'admissions_officer', 'finance_officer'],
  },
  {
    label: 'Staff', href: '/staff', icon: <Users size={18} />,
    roles: ['principal', 'deputy_principal', 'super_admin'],
  },
  {
    label: 'Attendance', href: '/attendance', icon: <UserCheck size={18} />,
    roles: ['principal', 'deputy_principal', 'class_teacher', 'subject_teacher', 'hod'],
  },
  {
    label: 'Academics', href: '/academics', icon: <BookOpen size={18} />,
    roles: ['principal', 'deputy_principal', 'hod', 'class_teacher', 'subject_teacher'],
    children: [
      { label: 'Timetable', href: '/academics/timetable', icon: <Calendar size={16} /> },
      { label: 'Exams', href: '/academics/exams', icon: <ClipboardList size={16} /> },
      { label: 'Marks Entry', href: '/academics/marks', icon: <FileText size={16} /> },
      { label: 'Report Cards', href: '/academics/reports', icon: <FileText size={16} /> },
    ],
  },
  {
    label: 'Finance', href: '/finance', icon: <DollarSign size={18} />,
    roles: ['principal', 'finance_officer', 'deputy_principal'],
    children: [
      { label: 'Fee Invoices', href: '/finance/invoices', icon: <FileText size={16} /> },
      { label: 'Payments', href: '/finance/payments', icon: <DollarSign size={16} /> },
      { label: 'Reports', href: '/finance/reports', icon: <FileText size={16} /> },
    ],
  },
  {
    label: 'Discipline', href: '/discipline', icon: <Shield size={18} />,
    roles: ['principal', 'deputy_principal', 'class_teacher', 'hod', 'counselor'],
  },
  {
    label: 'Counseling', href: '/counseling', icon: <Heart size={18} />,
    roles: ['principal', 'deputy_principal', 'counselor'],
  },
  {
    label: 'Library', href: '/library', icon: <Library size={18} />,
    roles: ['principal', 'librarian'],
  },
  {
    label: 'Medical', href: '/medical', icon: <Stethoscope size={18} />,
    roles: ['principal', 'medical_officer'],
  },
  {
    label: 'Requests', href: '/requests', icon: <ClipboardList size={18} />,
    roles: ['principal', 'deputy_principal', 'hod', 'class_teacher', 'subject_teacher', 'counselor', 'finance_officer', 'medical_officer'],
  },
  {
    label: 'Communications', href: '/communications', icon: <MessageSquare size={18} />,
    roles: ['principal', 'deputy_principal'],
  },
  {
    label: 'Settings', href: '/settings', icon: <Settings size={18} />,
    roles: ['principal', 'super_admin'],
    children: [
      { label: 'School Config', href: '/settings/school', icon: <Settings size={16} /> },
      { label: 'Academic Config', href: '/settings/academic', icon: <BookOpen size={16} /> },
      { label: 'Fee Config', href: '/settings/fees', icon: <DollarSign size={16} /> },
      { label: 'Users', href: '/settings/users', icon: <Users size={16} /> },
      { label: 'Notifications', href: '/settings/notifications', icon: <Bell size={16} /> },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpanded(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]);
  };

  const filteredNav = navItems.filter(item => !item.roles || (user?.role && item.roles.includes(user.role)));

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <GraduationCap size={20} className="text-sidebar-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold">School ERP</p>
          <p className="text-xs text-sidebar-foreground/60">Management System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-1">
          {filteredNav.map(item => (
            <li key={item.href}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      pathname.startsWith(item.href) && 'bg-sidebar-accent text-sidebar-accent-foreground'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </span>
                    {expanded.includes(item.label) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {expanded.includes(item.label) && (
                    <ul className="mt-1 ml-4 space-y-1 border-l border-sidebar-border pl-3">
                      {item.children.map(child => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              pathname === child.href && 'bg-sidebar-primary text-sidebar-primary-foreground'
                            )}
                          >
                            {child.icon}
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    pathname === item.href && 'bg-sidebar-primary text-sidebar-primary-foreground'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-semibold">
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user ? getRoleLabel(user.role) : ''}</p>
            </div>
          </Link>
          <button onClick={logout} className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
