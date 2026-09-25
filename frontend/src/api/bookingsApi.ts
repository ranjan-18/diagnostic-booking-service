import { apiClient } from './client';
import {
  Booking,
  BookingFilterParams,
  CreateBookingPayload,
  PaginatedResponse,
} from '../types';

export const bookingsApi = {
  getBookings: async (params?: BookingFilterParams): Promise<PaginatedResponse<Booking>> => {
    const { data } = await apiClient.get<PaginatedResponse<Booking>>('/api/bookings/', {
      params,
    });
    return data;
  },

  getBookingById: async (id: number): Promise<Booking> => {
    const { data } = await apiClient.get<Booking>(`/api/bookings/${id}/`);
    return data;
  },

  createBooking: async (payload: CreateBookingPayload): Promise<Booking> => {
    const { data } = await apiClient.post<Booking>('/api/bookings/', payload);
    return data;
  },

  cancelBooking: async (id: number): Promise<Booking> => {
    const { data } = await apiClient.post<Booking>(`/api/bookings/${id}/cancel/`);
    return data;
  },
};
