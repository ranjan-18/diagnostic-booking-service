import { BookingStatus, PaymentStatus } from '../types';

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const rawEnvUrl = (import.meta.env.VITE_API_URL || '').trim();
// Disregard dead temporary tunnels (e.g., loca.lt, ngrok) if inadvertently set in Vercel env
const cleanEnvUrl = (rawEnvUrl.includes('loca.lt') || rawEnvUrl.includes('ngrok')) ? '' : rawEnvUrl;

export const API_BASE_URL = cleanEnvUrl || (isLocalhost ? 'http://127.0.0.1:8000' : '');


export const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string; border: string; dot: string }> = {
  PENDING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  CONFIRMED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  FAILED: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  CANCELLED: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string; border: string }> = {
  SUCCESS: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  FAILED: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};
