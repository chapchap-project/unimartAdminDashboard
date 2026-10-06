import React, { useEffect, useState } from 'react';
import { RefreshCw, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminRefundPage, RefundStatus } from '../types';
import { api } from '../services/api';

const labels: Record<RefundStatus, string> = {
  QUEUED: 'Queued', PROCESSING: 'Processing', SUCCESS: 'Completed', FAILED: 'Failed', UNKNOWN: 'Needs confirmation',
};
const colors: Record<RefundStatus, string> = {
  QUEUED: 'bg-slate-100 text-slate-700', PROCESSING: 'bg-blue-50 text-blue-700',
  SUCCESS: 'bg-emerald-50 text-emerald-700', FAILED: 'bg-rose-50 text-rose-700', UNKNOWN: 'bg-amber-50 text-amber-800',
};
const date = (value: string | null) => value ? new Date(value).toLocaleString() : '—';

export default function RefundsView() {
  const [status, setStatus] = useState<RefundStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminRefundPage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    setLoading(true);
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await api.getRefunds(page, status);
        if (!cancelled) {
          setData(result);
          setError('');
          setUpdatedAt(new Date());
          if (result.pagination.pages > 0 && page > result.pagination.pages) setPage(result.pagination.pages);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load refunds.');
      } finally {
        inFlight = false;
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const timer = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [page, status, refresh]);

  return <div className="space-y-6">
    <div className="flex flex-wrap gap-4 items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3"><RotateCcw className="text-emerald-600" />Buyer refunds</h1>
        <p className="text-sm text-slate-500 mt-2">Track refunds for orders not verified within 24 hours, including failures and their reasons.</p>
      </div>
      <button onClick={() => setRefresh(value => value + 1)} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50">
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh
      </button>
    </div>

    <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <label className="text-sm font-medium text-slate-600 flex items-center gap-3">Status
          <select value={status} onChange={event => { setStatus(event.target.value as RefundStatus | 'ALL'); setPage(1); setData(null); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900">
            <option value="ALL">All refunds</option>
            {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <p className="text-xs text-slate-500">{data ? `${data.pagination.total} refund${data.pagination.total === 1 ? '' : 's'} · ` : ''}Updates every 15 seconds</p>
      </div>
      {error && <p role="alert" className="px-5 py-4 bg-rose-50 text-rose-700 text-sm">{error} {data && 'Showing the last loaded results.'}</p>}
      {loading && !data ? <p role="status" className="p-10 text-center text-slate-500">Loading refunds…</p> : <>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
              <th className="px-5 py-3">Buyer &amp; order</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 min-w-72">Details &amp; failure reason</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">{data?.refunds.map(refund => <tr key={refund.id}>
              <td className="px-5 py-4 align-top min-w-56">
                <p className="font-semibold text-slate-900">{refund.buyer.name}</p>
                <p className="text-xs text-slate-500 break-all mt-1">{refund.buyer.email}</p>
                <p className="text-xs text-slate-500 mt-1">{refund.refundPhoneNumber || refund.buyer.phoneNumber || 'No phone number saved'}</p>
                <p className="text-slate-700 mt-3">{refund.listing.title}</p>
                <p className="text-xs text-slate-500">Seller: {refund.seller.name}</p>
              </td>
              <td className="px-5 py-4 align-top font-semibold whitespace-nowrap">{refund.payment.currency} {refund.payment.amount.toLocaleString()}</td>
              <td className="px-5 py-4 align-top"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors[refund.refundStatus]}`}>{labels[refund.refundStatus]}</span>
                <p className="text-xs text-slate-400 mt-2">{refund.refundAttempts} attempts / checks</p>
              </td>
              <td className="px-5 py-4 align-top max-w-md">
                <p className={`break-words ${refund.refundStatus === 'FAILED' ? 'text-rose-700' : 'text-slate-600'}`}>{refund.refundResultDescription || (refund.refundStatus === 'QUEUED' ? 'Waiting for the next hourly refund sweep.' : 'No additional details recorded.')}</p>
                <p className="text-xs text-slate-400 mt-2">Updated {date(refund.updatedAt)}</p>
                <details className="mt-3 text-xs text-slate-500">
                  <summary className="cursor-pointer font-semibold text-slate-600">References &amp; timeline</summary>
                  <dl className="mt-2 space-y-2 break-all">
                    <div><dt className="font-semibold">Payment ID</dt><dd>{refund.paymentId}</dd></div>
                    <div><dt className="font-semibold">Refund reference</dt><dd>{refund.reference}</dd></div>
                    <div><dt className="font-semibold">Provider reference</dt><dd>{refund.refundProviderReference || 'Not recorded'}</dd></div>
                    <div><dt className="font-semibold">Eligible for refund</dt><dd>{date(refund.eligibleAt)}</dd></div>
                    <div><dt className="font-semibold">Last attempt / check</dt><dd>{date(refund.refundLastAttemptAt)}</dd></div>
                    <div><dt className="font-semibold">Completed</dt><dd>{date(refund.refundCompletedAt)}</dd></div>
                  </dl>
                </details>
              </td>
            </tr>)}</tbody>
          </table>
        </div>
        {data && data.refunds.length === 0 && <p className="p-10 text-center text-slate-500">{status === 'ALL' ? 'No refunds yet.' : `No refunds with status “${labels[status]}”.`}</p>}
      </>}
      <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">{updatedAt ? `Last refreshed ${updatedAt.toLocaleTimeString()}` : 'Waiting for refund data'}</p>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => { setPage(value => value - 1); setData(null); }} className="p-2 border rounded-lg disabled:opacity-30"><ChevronLeft size={16} /></button>
          <span>Page {page} of {Math.max(1, data?.pagination.pages || 1)}</span>
          <button aria-label="Next page" disabled={!data || page >= data.pagination.pages || loading} onClick={() => { setPage(value => value + 1); setData(null); }} className="p-2 border rounded-lg disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      </div>
    </section>
    <p className="text-xs text-slate-500">Completed refunds include earlier records. Detailed failure reasons are available for attempts made after refund tracking was enabled. “Needs confirmation” means the provider outcome is unconfirmed and requires reconciliation.</p>
  </div>;
}
