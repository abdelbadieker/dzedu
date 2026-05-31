'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Loader2, Ban, CheckCircle, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

interface UserEntry {
  id: string;
  email: string;
  role: string;
  banState: string;
  banReason?: string | null;
  language: string;
  createdAt: string;
  profile: { firstName: string | null; lastName: string | null; phoneNumber: string | null } | null;
  _count: { enrollments: number; taughtCourses: number; invoices: number };
}

interface Pagination {
  page: number; limit: number; total: number; totalPages: number;
}

export default function UsersPage() {
  const t = useTranslations('Navigation');
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', ...(search ? { search } : {}) });
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const toggleBan = async (userId: string, currentBan: string) => {
    setUpdating(userId);
    const newBan = currentBan === 'NONE' ? 'TEMPORARY' : 'NONE';
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banState: newBan, banReason: newBan === 'TEMPORARY' ? 'Banned by admin' : null }),
    });
    setUpdating(null);
    fetchUsers(pagination.page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('users')}</h1>
        <p className="text-sm text-muted-foreground">{pagination.total} users</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Enrollments</th>
                <th className="px-4 py-3 text-left font-medium">Courses</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.profile ? `${user.profile.firstName ?? ''} ${user.profile.lastName ?? ''}`.trim() : '—'}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs">{user.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {user.banState !== 'NONE' ? (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <Ban className="h-3 w-3" /> Banned
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">{user._count.enrollments}</td>
                  <td className="px-4 py-3 text-xs">{user._count.taughtCourses}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleBan(user.id, user.banState)}
                      disabled={updating === user.id}
                      className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
                        user.banState !== 'NONE'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                      } disabled:opacity-50`}
                    >
                      {updating === user.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : user.banState !== 'NONE' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Ban className="h-3 w-3" />
                      )}
                      {user.banState !== 'NONE' ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchUsers(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded-lg border p-2 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchUsers(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg border p-2 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
