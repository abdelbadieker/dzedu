import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Users,
  HeartHandshake,
  Wallet,
  DollarSign,
  ShieldCheck,
  BarChart3,
  Settings,
  UserCircle,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  labelKey?: string;
  items: NavItem[];
}

export type RoleNavConfig = Record<string, NavSection[]>;

export const roleNavigation: RoleNavConfig = {
  SUPER_ADMIN: [
    {
      items: [{ labelKey: 'Navigation.overview', href: '/dashboard', icon: LayoutDashboard }],
    },
    {
      labelKey: 'Navigation.analytics',
      items: [
        { labelKey: 'Navigation.users', href: '/dashboard/users', icon: ShieldCheck },
        { labelKey: 'Navigation.courses', href: '/dashboard/courses', icon: BookOpen },
        { labelKey: 'Navigation.payments', href: '/dashboard/invoices', icon: Wallet },
        { labelKey: 'Navigation.analytics', href: '/dashboard/analytics', icon: BarChart3 },
      ],
    },
    {
      labelKey: 'Navigation.system',
      items: [
        { labelKey: 'Navigation.settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ],
  ADMIN: [
    {
      items: [{ labelKey: 'Navigation.overview', href: '/dashboard', icon: LayoutDashboard }],
    },
    {
      labelKey: 'Navigation.analytics',
      items: [
        { labelKey: 'Navigation.users', href: '/dashboard/users', icon: Users },
        { labelKey: 'Navigation.courses', href: '/dashboard/courses', icon: BookOpen },
        { labelKey: 'Navigation.payments', href: '/dashboard/invoices', icon: Wallet },
        { labelKey: 'Navigation.analytics', href: '/dashboard/analytics', icon: BarChart3 },
      ],
    },
    {
      items: [{ labelKey: 'Navigation.settings', href: '/dashboard/settings', icon: Settings }],
    },
  ],
  TEACHER: [
    {
      items: [
        { labelKey: 'Navigation.overview', href: '/dashboard', icon: LayoutDashboard },
        { labelKey: 'Navigation.courses', href: '/dashboard/courses', icon: GraduationCap },
        { labelKey: 'Navigation.students', href: '/dashboard/students', icon: Users },
        { labelKey: 'Navigation.earnings', href: '/dashboard/earnings', icon: DollarSign },
      ],
    },
    {
      items: [
        { labelKey: 'Navigation.settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ],
  STUDENT: [
    {
      items: [
        { labelKey: 'Navigation.overview', href: '/dashboard', icon: LayoutDashboard },
        { labelKey: 'Navigation.myCourses', href: '/dashboard/courses', icon: BookOpen },
        { labelKey: 'Navigation.myProgress', href: '/dashboard/progress', icon: TrendingUp },
      ],
    },
    {
      items: [
        { labelKey: 'Navigation.settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ],
  PARENT: [
    {
      items: [
        { labelKey: 'Navigation.overview', href: '/dashboard', icon: LayoutDashboard },
        { labelKey: 'Navigation.children', href: '/dashboard/children', icon: HeartHandshake },
        { labelKey: 'Navigation.payments', href: '/dashboard/invoices', icon: Wallet },
      ],
    },
    {
      items: [
        { labelKey: 'Navigation.settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ],
};
