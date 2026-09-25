import React, { useState } from 'react';
import { Terminal, Send, RefreshCw, CheckCircle2, ShieldCheck, Copy, Check, Info } from 'lucide-react';
import { PaymentStatus, WebhookResponse } from '../../types';
import { paymentsApi, parseApiError } from '../../api';
import { useNotification } from '../../context/NotificationContext';
import { Button, Input, Card } from '../common';

interface WebhookLogEntry {
  id: string;
  timestamp: string;
  eventId: string;
  bookingId: number;
  status: PaymentStatus;
  response: WebhookResponse;
  isDuplicate: boolean;
  message: string;
}

export const WebhookPlayground: React.FC = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [eventId, setEventId] = useState<string>(() => crypto.randomUUID());
  const [bookingId, setBookingId] = useState<string>('1');
  const [status, setStatus] = useState<PaymentStatus>('SUCCESS');
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<WebhookLogEntry[]>([]);
  const [copied, setCopied] = useState(false);

  const generateNewEventId = () => {
    setEventId(crypto.randomUUID());
  };

  const handleCopyEventId = () => {
    navigator.clipboard.writeText(eventId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWebhook = async () => {
    if (!bookingId || isNaN(Number(bookingId))) {
      showError('Please enter a valid numeric Booking ID.');
      return;
    }

    setIsSending(true);
    try {
      const parsedBookingId = parseInt(bookingId, 10);
      const res = await paymentsApi.sendWebhook({
        event_id: eventId,
        booking_id: parsedBookingId,
        status,
      });

      const isDuplicate = !!res.idempotent;
      const message =
        res.message ||
        (isDuplicate
          ? 'Duplicate event_id detected. Webhook skipped (idempotent 200 OK).'
          : `Webhook processed successfully: Booking #${parsedBookingId} status updated to ${status}.`);

      const newLog: WebhookLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        eventId,
        bookingId: parsedBookingId,
        status,
        response: res,
        isDuplicate,
        message,
      };

      setLogs((prev) => [newLog, ...prev]);

      if (isDuplicate) {
        showInfo(message);
      } else {
        showSuccess(message);
      }
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explanation Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold">Webhook Idempotency Sandbox</h2>
        </div>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          In distributed systems, payment gateways retry webhooks upon network timeouts. This sandbox lets you fire simulated provider webhooks to <code className="text-brand-300 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono text-xs">POST /api/payments/webhook/</code>.
          Sending the <strong>same event_id twice</strong> demonstrates atomic idempotency via database unique constraints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Panel */}
        <Card className="lg:col-span-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            Dispatch Simulated Webhook
          </h3>

          <div className="space-y-4 pt-2">
            {/* Event ID with Generate/Copy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Event ID (Idempotency Key)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyEventId}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={generateNewEventId}
                    className="text-[11px] font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    New UUID
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Target Booking ID */}
            <Input
              label="Target Booking ID"
              type="number"
              min="1"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="e.g. 1"
              helperText="Enter the ID of an existing booking created in the system."
            />

            {/* Status Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Webhook Status Payload
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('SUCCESS')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all ${
                    status === 'SUCCESS'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  SUCCESS (Confirms)
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('FAILED')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all ${
                    status === 'FAILED'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  FAILED (Marks Failed)
                </button>
              </div>
            </div>

            {/* Payload preview */}
            <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-xs space-y-1">
              <span className="text-[10px] uppercase text-slate-500 block">HTTP Request Body</span>
              <pre className="text-brand-400 overflow-x-auto">
{JSON.stringify({ event_id: eventId, booking_id: Number(bookingId) || 1, status }, null, 2)}
              </pre>
            </div>

            {/* Send Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleSendWebhook}
                isLoading={isSending}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Webhook to Backend
              </Button>
            </div>
          </div>
        </Card>

        {/* Live Execution Logs */}
        <Card className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Execution Activity Log</h3>
              <p className="text-xs text-slate-400">Real-time inspection of webhook results & idempotency checks</p>
            </div>
            {logs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setLogs([])}>
                Clear
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[480px] space-y-3">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 gap-2">
                <Terminal className="w-8 h-8 text-slate-300" />
                <p className="text-xs">No webhooks dispatched in this session yet.</p>
                <p className="text-[11px] text-slate-400">Click &ldquo;Send Webhook to Backend&rdquo; to test live idempotency.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                    log.isDuplicate
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {log.isDuplicate ? (
                        <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-extrabold text-[10px]">
                          IDEMPOTENT (NO-OP)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-extrabold text-[10px]">
                          PROCESSED (200 OK)
                        </span>
                      )}
                      <span>Booking #{log.bookingId} → {log.status}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{log.timestamp}</span>
                  </div>

                  <div className="font-mono text-[11px] bg-white/80 p-2.5 rounded-lg border border-slate-200/60 overflow-x-auto space-y-1">
                    <div><strong>event_id:</strong> {log.eventId}</div>
                    <div className={log.isDuplicate ? 'text-amber-800' : 'text-emerald-800'}>
                      {log.isDuplicate ? '⚡' : '✓'} {log.message}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
