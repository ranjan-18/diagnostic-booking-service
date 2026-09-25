import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { BookingStatus } from '../../types';

interface StatusTimelineProps {
  status: BookingStatus;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ status }) => {
  const steps: { key: BookingStatus; label: string; icon: React.ReactNode }[] = [
    { key: 'PENDING', label: 'Booking Created', icon: <Clock className="w-4 h-4" /> },
    {
      key: status === 'FAILED' ? 'FAILED' : status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
      label:
        status === 'CONFIRMED'
          ? 'Payment Confirmed'
          : status === 'FAILED'
          ? 'Payment Failed'
          : status === 'CANCELLED'
          ? 'Booking Cancelled'
          : 'Awaiting Payment',
      icon:
        status === 'CONFIRMED' ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : status === 'FAILED' ? (
          <AlertTriangle className="w-4 h-4" />
        ) : status === 'CANCELLED' ? (
          <XCircle className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        ),
    },
  ];

  return (
    <div className="flex items-center gap-2 py-2">
      {steps.map((step, idx) => {
        const isCurrent = step.key === status;
        const isPast = idx === 0 && status !== 'PENDING';

        return (
          <React.Fragment key={step.key}>
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCurrent
                    ? status === 'CONFIRMED'
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                      : status === 'FAILED'
                      ? 'bg-rose-500 text-white'
                      : status === 'CANCELLED'
                      ? 'bg-slate-400 text-white'
                      : 'bg-amber-500 text-white'
                    : isPast
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step.icon}
              </div>
              <span className={`text-xs font-semibold ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 flex-1 rounded ${
                  status === 'CONFIRMED'
                    ? 'bg-emerald-400'
                    : status === 'FAILED'
                    ? 'bg-rose-300'
                    : status === 'CANCELLED'
                    ? 'bg-slate-300'
                    : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
