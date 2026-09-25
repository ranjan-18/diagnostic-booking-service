import { DiagnosticCentre, DiagnosticTest } from './centre';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export interface Booking {
  id: number;
  test: DiagnosticTest;
  centre: DiagnosticCentre;
  appointment_datetime: string;
  amount: string;
  status: BookingStatus;
  status_display: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingPayload {
  test: number;
  centre: number;
  appointment_datetime: string;
  notes?: string;
}

export interface BookingFilterParams {
  status?: BookingStatus;
  ordering?: string;
}
