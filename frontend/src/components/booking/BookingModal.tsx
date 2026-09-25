import React, { useState } from 'react';
import { Calendar, Clock, Building, Activity, FileText } from 'lucide-react';
import { DiagnosticCentre, DiagnosticTest } from '../../types';
import { bookingsApi, parseApiError } from '../../api';
import { formatCurrency, getMinBookingDateTime } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { Button, Input, Modal } from '../common';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: DiagnosticTest | null;
  centre: DiagnosticCentre | null;
  onBookingSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  test,
  centre,
  onBookingSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const [appointmentDatetime, setAppointmentDatetime] = useState<string>(getMinBookingDateTime());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!test || !centre) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentDatetime) {
      showError('Please select a valid appointment date and time.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert local datetime to ISO string
      const isoDate = new Date(appointmentDatetime).toISOString();

      await bookingsApi.createBooking({
        test: test.id,
        centre: centre.id,
        appointment_datetime: isoDate,
        notes,
      });

      showSuccess(`Booking confirmed in PENDING status for ${test.name}!`);
      onBookingSuccess();
      onClose();
    } catch (err) {
      showError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Diagnostic Appointment" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Test & Centre Summary Box */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <span className="font-bold text-slate-900">{test.name}</span>
            </div>
            <span className="font-extrabold text-brand-700 text-base">
              {formatCurrency(test.price)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building className="w-4 h-4 text-slate-400" />
            <span>{centre.name} ({centre.location})</span>
          </div>

          <p className="text-xs text-slate-500 pt-1 border-t border-slate-200/60">
            {test.description || 'Routine diagnostic evaluation with digital report delivery.'}
          </p>
        </div>

        {/* Date & Time Picker */}
        <div className="space-y-1.5">
          <Input
            label="Appointment Date & Time"
            type="datetime-local"
            min={getMinBookingDateTime()}
            value={appointmentDatetime}
            onChange={(e) => setAppointmentDatetime(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            required
            helperText="Appointments must be scheduled at least 24 hours in advance."
          />
        </div>

        {/* Optional Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Special Instructions / Notes (Optional)
          </label>
          <div className="relative rounded-xl">
            <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fasting 10 hours, prior prescription attached, wheelchair access required"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-slate-300 resize-none"
            />
          </div>
        </div>

        {/* Pricing notice */}
        <div className="text-[11px] text-slate-500 bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            The price is snapshotted upon booking creation. Your booking will initially be marked <strong>PENDING</strong> until payment is simulated or received via webhook.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Confirm Booking
          </Button>
        </div>
      </form>
    </Modal>
  );
};
