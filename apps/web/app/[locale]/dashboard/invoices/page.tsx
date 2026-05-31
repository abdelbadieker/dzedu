'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle, XCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface InvoiceEntry {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  status: string;
  receiptUrl?: string | null;
  baridimobReceiptUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
  paymentMethodDetail?: string | null;
  user: {
    email: string;
    profile: { firstName: string | null; lastName: string | null; phoneNumber: string | null } | null;
  };
  course: { id: string; title: string } | null;
  adminApprovedBy: { id: string; email: string } | null;
}

interface Pagination {
  page: number; limit: number; total: number; totalPages: number;
}

export default function InvoicesPage() {
  const t = useTranslations('Navigation');
  const [invoices, setInvoices] = useState<InvoiceEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [approving, setApproving] = useState<string | null>(null);

  const fetchInvoices = async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', ...(statusFilter ? { status: statusFilter } : {}) });
    const res = await fetch(`/api/admin/invoices?${params}`);
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices);
      setPagination(data.pagination);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const approveInvoice = async (invoiceId: string, status: 'PAID' | 'FAILED') => {
    setApproving(invoiceId);
    await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes: status === 'PAID' ? 'Approved by admin' : 'Rejected by admin' }),
    });
    setApproving(null);
    fetchInvoices(pagination.page);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      PENDING_ADMIN_APPROVAL: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      FAILED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      REFUNDED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    };
    return `rounded px-2 py-0.5 text-xs ${styles[status] ?? 'bg-muted text-muted-foreground'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); fetchInvoices(1); }}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING_ADMIN_APPROVAL">Pending Approval</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Invoice</th>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Method</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Receipt</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => {
                const name = inv.user.profile
                  ? `${inv.user.profile.firstName ?? ''} ${inv.user.profile.lastName ?? ''}`.trim()
                  : inv.user.email;

                return (
                  <tr key={inv.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{inv.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{name}</div>
                      <div className="text-xs text-muted-foreground">{inv.course?.title ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {Number(inv.amount).toFixed(2)} {inv.currency}
                    </td>
                    <td className="px-4 py-3 text-xs">{inv.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(inv.status)}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {(inv.baridimobReceiptUrl || inv.receiptUrl) && (
                        <a
                          href={inv.baridimobReceiptUrl ?? inv.receiptUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {inv.status === 'PENDING_ADMIN_APPROVAL' && (
                          <>
                            <button
                              onClick={() => approveInvoice(inv.id, 'PAID')}
                              disabled={approving === inv.id}
                              className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900 dark:text-green-300"
                            >
                              {approving === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => approveInvoice(inv.id, 'FAILED')}
                              disabled={approving === inv.id}
                              className="flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900 dark:text-red-300"
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => fetchInvoices(pagination.page - 1)} disabled={pagination.page <= 1} className="rounded-lg border p-2 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-muted-foreground">{pagination.page} / {pagination.totalPages}</span>
          <button onClick={() => fetchInvoices(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="rounded-lg border p-2 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
