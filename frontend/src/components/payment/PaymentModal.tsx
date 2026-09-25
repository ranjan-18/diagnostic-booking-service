import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { Booking } from '../../types';
import { paymentsApi, parseApiError } from '../../api';
import { formatCurrency } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { Button, Modal, BookingStatusBadge } from '../common';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onPaymentComplete: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentComplete,
}) => {
  const { showSuccess, showError } = useNotification();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    status: 'SUCCESS' | 'FAILED';
    transactionId: string;
    bookingStatus: string;
  } | null>(null);

  if (!booking) return null;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setResult(null);
    try {
      const data = await paymentsApi.simulatePayment(booking.id);
      setResult({
        status: data.payment.status,
        transactionId: data.payment.transaction_id,
        bookingStatus: data.booking.status,
      });

      if (data.payment.status === 'SUCCESS') {
        showSuccess(`Payment verified! Booking #${booking.id} is now CONFIRMED.`);
      } else {
        showError(`Simulated payment failed. Booking #${booking.id} marked as FAILED (retries allowed).`);
      }
      onPaymentComplete();
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Simulate Payment Gateway"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Booking Summary */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Booking Ref #{booking.id}
            </span>
            <BookingStatusBadge status={booking.status} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <div>
              <p className="font-bold text-slate-900">{booking.test?.name}</p>
              <p className="text-xs text-slate-500">{booking.centre?.name}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Amount Due</span>
              <span className="text-lg font-black text-brand-700">
                {formatCurrency(booking.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Informational banner about simulation */}
        {!result && (
          <div className="bg-sky-50/80 border border-sky-200/80 rounded-xl p-3.5 text-xs text-sky-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-sky-950">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Simulated Payment Gateway (80% Success Probability)</span>
            </div>
            <p className="text-sky-800 leading-relaxed">
              In production, this initiates a Razorpay / Stripe checkout session. Here, the backend randomly simulates SUCCESS (80%) or FAILED (20%) wrapped in an atomic database transaction with row locking.
            </p>
          </div>
        )}

        {/* Result Notification Box */}
        {result && (
          <div
            className={`p-4 rounded-xl border animate-in fade-in zoom-in-95 space-y-2 ${
              result.status === 'SUCCESS'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {result.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <h4 className="font-bold text-sm">
                Payment {result.status === 'SUCCESS' ? 'Successful' : 'Failed'}
              </h4>
            </div>

            <div className="text-xs space-y-1 pl-7">
              <p>
                <strong>Transaction ID:</strong>{' '}
                <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-[11px]">
                  {result.transactionId}
                </code>
              </p>
              <p>
                <strong>Updated Booking Status:</strong>{' '}
                <span className="font-bold uppercase">{result.bookingStatus}</span>
              </p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={handleModalClose} disabled={isProcessing}>
            {result ? 'Done' : 'Cancel'}
          </Button>

          {!result ? (
            <Button
              variant="primary"
              onClick={handleSimulatePayment}
              isLoading={isProcessing}
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              Simulate Pay {formatCurrency(booking.amount)}
            </Button>
          ) : result.status === 'FAILED' ? (
            <Button
              variant="secondary"
              onClick={handleSimulatePayment}
              isLoading={isProcessing}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retry Payment
            </Button>
          ) : (
            <Button variant="primary" onClick={handleModalClose} rightIcon={<ArrowRight className="w-4 h-4" />}>
              View Updated Bookings
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
