import React, { useCallback, useEffect, useState } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { AdminPayout } from '../types';
import { api } from '../services/api';
import PayoutDialog from './PayoutDialog';

export default function PayoutsPanel() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { const data = await api.getPayouts(); setPayouts(data.payouts); setError(''); }
    catch (err: any) { setError(err.message || 'Could not load payments.'); }
  }, []);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [refresh]);

  return <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="p-6 flex flex-wrap gap-4 items-center justify-between">
      <div><h2 className="text-lg font-bold text-slate-900">M-Pesa payments</h2><p className="text-sm text-slate-500 mt-1">Send a payment or retry a failed payout. For an existing sale, use its retry action below.</p></div>
      <div className="flex gap-2"><button onClick={refresh} aria-label="Refresh payments" className="p-3 border rounded-xl"><RefreshCw size={16} /></button><button onClick={() => setDialog('new')} className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-4 py-3 text-sm font-bold"><Send size={16} />Send to M-Pesa</button></div>
    </div>
    {error && <p role="alert" className="px-6 pb-4 text-sm text-rose-600">{error}</p>}
    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-3">Recipient</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Action</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{payouts.map(payout => <tr key={payout.id}>
        <td className="px-6 py-4"><p className="font-semibold">{payout.seller?.name || payout.recipientName || 'Recipient'}</p><p className="text-slate-500">{payout.phoneNumber}</p></td>
        <td className="px-4 py-4 whitespace-nowrap">KSH {payout.amount.toLocaleString()}</td>
        <td className="px-4 py-4"><span className={`text-xs font-bold ${payout.status === 'SUCCESS' ? 'text-emerald-600' : payout.status === 'FAILED' ? 'text-rose-600' : 'text-amber-600'}`}>{payout.status}</span></td>
        <td className="px-4 py-4 max-w-sm"><p className="text-slate-600 break-words">{payout.resultDescription || payout.payoutReason || payout.activePayment?.listing?.title || 'Seller payout'}</p><p className="text-xs text-slate-400 mt-1">{new Date(payout.updatedAt).toLocaleString()}</p>
          <details className="mt-2 text-xs text-slate-500"><summary className="cursor-pointer">Reference &amp; admin history</summary><p className="mt-2 break-all">{payout.merchantReference}</p>{payout.adminActions?.map(action => <div key={action.id} className="border-t mt-2 pt-2"><p>{action.kind === 'RETRY' ? 'Retry' : 'Manual payment'} · {new Date(action.createdAt).toLocaleString()}</p><p>KSH {action.amount} → {action.phoneNumber}</p><p>{action.reason}</p><p className="break-all">{action.reference}</p></div>)}</details>
        </td>
        <td className="px-4 py-4">{payout.status === 'FAILED' && <button onClick={() => setDialog(payout.id)} className="text-emerald-700 font-bold whitespace-nowrap">Retry payment</button>}</td>
      </tr>)}</tbody>
    </table></div>
    {!payouts.length && !error && <p className="p-6 text-slate-500 text-sm">No payouts yet.</p>}
    <p className="px-6 py-3 text-xs text-slate-400 bg-slate-50">Most recent 100 payments · Updates every 15 seconds</p>
    {dialog && <PayoutDialog payoutId={dialog === 'new' ? undefined : dialog} onClose={() => setDialog(null)} onQueued={refresh} />}
  </section>;
}
