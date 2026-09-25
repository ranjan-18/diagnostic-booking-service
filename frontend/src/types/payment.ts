import { Booking } from './booking';

export type PaymentStatus = 'SUCCESS' | 'FAILED';

export interface Payment {
  id: number;
  booking: number;
  amount: string;
  status: PaymentStatus;
  transaction_id: string;
  created_at: string;
}

export interface PaymentSimulationResponse {
  payment: Payment;
  booking: Booking;
}

export interface WebhookPayload {
  event_id: string;
  booking_id: number;
  status: PaymentStatus;
}

export interface WebhookResponse {
  message?: string;
  event_id?: string;
  idempotent?: boolean;
  payment?: Payment;
  booking?: Booking;
}
