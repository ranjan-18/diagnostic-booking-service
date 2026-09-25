import React from 'react';
import { BookingStatus, PaymentStatus } from '../../types';
import { STATUS_COLORS, PAYMENT_STATUS_COLORS } from '../../utils/constants';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const sizes = {
    sm: 'text-[10px] font-semibold px-2 py-0.5 rounded-md',
    md: 'text-xs font-semibold px-2.5 py-1 rounded-lg',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border leading-none ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
};

export const BookingStatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
  const style = STATUS_COLORS[status] || STATUS_COLORS.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const style = PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS.FAILED;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
    >
      {status}
    </span>
  );
};
