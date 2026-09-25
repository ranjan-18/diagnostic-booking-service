import React, { useState } from 'react';
import { Calendar, Building, CreditCard, XCircle, ChevronRight, Activity, FileText, RotateCcw } from 'lucide-react';
import { Booking } from '../../types';
import { bookingsApi, parseApiError } from '../../api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { Button, Card, BookingStatusBadge } from '../common';
import { StatusTimeline } from './StatusTimeline';

interface BookingCardProps {
  booking: Booking;
  onPayClick: (booking: Booking) => void;
  onRebookClick?: (booking: Booking) => void;
  onStatusUpdated: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPayClick,
  onRebookClick,
  onStatusUpdated,
}) => {
  const { showSuccess, showError } = useNotification();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const canPay = booking.status === 'PENDING' || booking.status === 'FAILED';
  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const isCancelled = booking.status === 'CANCELLED';

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await bookingsApi.cancelBooking(booking.id);
      showSuccess(`Booking #${booking.id} cancelled successfully.`);
      setShowConfirmCancel(false);
      onStatusUpdated();
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card hoverEffect className="space-y-4">
      {/* Header with Booking ID and Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
            #{booking.id}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-brand-600" />
              {booking.test?.name || 'Diagnostic Test'}
            </h4>
            <span className="text-xs text-slate-400">
              Booked on {formatDateTime(booking.created_at)}
            </span>
          </div>
        </div>

        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Booking Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <Building className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Centre</span>
            <span className="font-semibold text-slate-800">{booking.centre?.name}</span>
            <span className="text-xs text-slate-500">{booking.centre?.location}</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Appointment</span>
            <span className="font-semibold text-slate-800">{formatDateTime(booking.appointment_datetime)}</span>
            <span className="text-xs text-brand-600 font-medium">Scheduled slot</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-50/50 border border-brand-100">
          <CreditCard className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider">Total Amount</span>
            <span className="font-extrabold text-brand-800 text-base">{formatCurrency(booking.amount)}</span>
            <span className="text-[10px] text-brand-600 font-medium">Price snapshotted</span>
          </div>
        </div>
      </div>

      {/* Optional Notes */}
      {booking.notes && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 text-xs text-slate-600">
          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span><strong>Notes:</strong> {booking.notes}</span>
        </div>
      )}

      {/* State Machine Visual Timeline */}
      <div className="pt-2 border-t border-slate-100">
        <StatusTimeline status={booking.status} />
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-400">
          {booking.status === 'PENDING' && 'Awaiting payment simulation or webhook confirmation'}
          {booking.status === 'CONFIRMED' && 'Payment verified. Please arrive 15 minutes prior to appointment.'}
          {booking.status === 'FAILED' && 'Payment failed. You can retry paying anytime.'}
          {booking.status === 'CANCELLED' && 'Booking was cancelled. You can re-book this test with a new appointment slot anytime.'}
        </div>

        <div className="flex items-center gap-2">
          {/* Rebook Button for CANCELLED Bookings */}
          {isCancelled && onRebookClick && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onRebookClick(booking)}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Rebook This Test
            </Button>
          )}

          {/* Cancel Button */}
          {canCancel && !showConfirmCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmCancel(true)}
              leftIcon={<XCircle className="w-4 h-4 text-rose-500" />}
            >
              Cancel Booking
            </Button>
          )}

          {/* Inline Cancel Confirmation */}
          {showConfirmCancel && (
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-rose-50 border border-rose-200 animate-in fade-in">
              <span className="text-xs font-semibold text-rose-700 px-2">Confirm cancel?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                isLoading={isCancelling}
              >
                Yes, Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmCancel(false)}
                disabled={isCancelling}
              >
                No
              </Button>
            </div>
          )}

          {/* Pay / Retry Button */}
          {canPay && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPayClick(booking)}
              leftIcon={<CreditCard className="w-4 h-4" />}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              {booking.status === 'FAILED' ? 'Retry Payment' : 'Simulate Payment'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
