'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { roleNavigation } from '@/lib/dashboard/navigation';
import { UserRole } from '@dzedu/shared';

interface SidebarProps {
  role: UserRole;
  userName: string;
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ role, userName, open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();

  const sections = roleNavigation[role] ?? [];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === `/${locale}/dashboard`;
    return pathname.startsWith(`/${locale}${href}`);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar-background text-sidebar-foreground transition-all duration-300 lg:static',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <Link
            href={`/${locale}/dashboard`}
            className={cn('flex items-center gap-2 font-bold', collapsed && 'justify-center')}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              DE
            </div>
            {!collapsed && <span className="truncate">DzEdu</span>}
          </Link>

          <button
            onClick={onClose}
            className="ml-auto lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={cn('border-b px-4 py-3', collapsed && 'px-2 text-center')}>
          <p className={cn('text-xs text-muted-foreground', collapsed && 'hidden')}>
            {t(`Auth.${role === UserRole.SUPER_ADMIN ? 'admin' : role.toLowerCase()}` as any) || role}
          </p>
          {!collapsed && (
            <p className="truncate text-sm font-medium">{userName}</p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {sections.map((section, idx) => (
            <div key={idx} className={cn('mb-4', idx > 0 && 'mt-2')}>
              {section.labelKey && !collapsed && (
                <p className="mb-1 px-3 text-xs font-semibold uppercase text-muted-foreground">
                  {t(section.labelKey)}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={`/${locale}${item.href}`}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          collapsed && 'justify-center px-2',
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="hidden border-t p-3 lg:block">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </aside>
    </>
  );
}
