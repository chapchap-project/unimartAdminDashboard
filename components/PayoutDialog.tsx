import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { AdminPayout } from '../types';

interface Props {
  payoutId?: string;
  onClose: () => void;
  onQueued: () => void;
}

export default function PayoutDialog({ payoutId, onClose, onQueued }: Props) {
  const [payout, setPayout] = useState<AdminPayout | null>(null);
  const [loading, setLoading] = useState(!!payoutId);
  const [busy, setBusy] = useState(false);
  const [phoneNumber, setPhone] = useState('');
  const [recipientName, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [review, setReview] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const requestId = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!payoutId) return;
    let cancelled = false;
    api.getPayout(payoutId).then(({ payout: payment }) => {
      if (cancelled) return;
      setPayout(payment);
      setPhone(payment.phoneNumber);
      setName(payment.seller?.name || payment.recipientName || 'Recipient');
      setAmount(String(payment.amount));
    }).catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [payoutId]);

  const canSend = !payoutId || payout?.status === 'FAILED';
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !canSend || success) return;
    if (!review) { setReview(true); setError(''); return; }
    setBusy(true);
    setError('');
    try {
      const common = { requestId: requestId.current, phoneNumber: phoneNumber.trim(), reason: reason.trim() };
      const response = payoutId && payout
        ? await api.retryPayout(payoutId, { ...common, expectedReference: payout.merchantReference })
        : await api.sendPayout({ ...common, recipientName: recipientName.trim(), amount: Number(amount) });
      setSuccess(response.message);
      onQueued();
    } catch (err: any) {
      setError(err.message || 'Could not queue the payment. Try again to check this request.');
    } finally { setBusy(false); }
  };
  const inputClass = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="payout-title" className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 id="payout-title" className="text-lg font-bold text-slate-900">{payoutId ? 'Retry seller payment' : 'Send to M-Pesa'}</h2>
          <button onClick={onClose} disabled={busy} aria-label="Close payment dialog" className="p-2 rounded-lg hover:bg-slate-100"><X size={20} /></button>
        </div>
        {loading ? <Loader2 className="animate-spin mx-auto" /> : <>
          <p className="text-sm text-slate-500">Payments are sent from your Paystack payout balance. Fund that balance before sending, including enough for transfer fees.</p>
          {payout?.resultDescription && <p className="bg-amber-50 text-amber-800 rounded-xl p-3 text-sm">Previous result: {payout.resultDescription}</p>}
          {payout && <div className="text-xs text-slate-500 break-all">Payment: {payout.id}<br />Status: <strong>{payout.status}</strong>{payout.activePayment?.listing && <><br />Item: {payout.activePayment.listing.title}</>}</div>}
          {!canSend && <p className="text-sm text-amber-800 bg-amber-50 rounded-xl p-3">Only confirmed failed payments can be retried. Pending payments must finish or be reconciled first.</p>}
          {error && <p role="alert" className="flex gap-2 text-sm text-rose-700 bg-rose-50 p-3 rounded-xl"><AlertCircle size={18} className="shrink-0" />{error}</p>}
          {success ? <div role="status" className="text-emerald-800 bg-emerald-50 rounded-xl p-4 space-y-3"><CheckCircle2 size={24} /><p>{success}</p><button onClick={onClose} className="font-bold underline">Done</button></div> : canSend && <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Recipient name<input required minLength={2} maxLength={100} value={recipientName} onChange={e => setName(e.target.value)} disabled={!!payoutId || review || busy} className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm font-medium text-slate-700">M-Pesa phone number<input required type="tel" pattern="(?:\+?254|0)[17][0-9]{8}" placeholder="0712345678" value={phoneNumber} onChange={e => setPhone(e.target.value)} disabled={review || busy} className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm font-medium text-slate-700">Amount (KSH)<input required type="number" min="1" max="250000" step="1" value={amount} onChange={e => setAmount(e.target.value)} disabled={!!payoutId || review || busy} className={`${inputClass} mt-1`} /></label>
            <label className="block text-sm font-medium text-slate-700">Reason<textarea required minLength={3} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} disabled={review || busy} placeholder="Why are you sending or retrying this payment?" className={`${inputClass} mt-1`} /></label>
            {review && <div className="rounded-xl bg-slate-50 p-4 text-sm"><strong>Confirm KSH {Number(amount).toLocaleString()} to {phoneNumber}</strong><p className="mt-1">Recipient: {recipientName}. This will queue a real M-Pesa payment.</p></div>}
            <div className="flex gap-3">
              {review && <button type="button" disabled={busy} onClick={() => setReview(false)} className="border border-slate-200 rounded-xl px-4 py-2 text-sm">Edit</button>}
              <button type="submit" disabled={busy} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{review ? 'Confirm and send payment' : 'Review payment'}</button>
            </div>
          </form>}
        </>}
      </section>
    </div>
  );
}
