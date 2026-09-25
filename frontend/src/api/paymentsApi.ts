import { apiClient } from './client';
import {
  PaymentSimulationResponse,
  WebhookPayload,
  WebhookResponse,
} from '../types';

export const paymentsApi = {
  simulatePayment: async (bookingId: number): Promise<PaymentSimulationResponse> => {
    const { data } = await apiClient.post<PaymentSimulationResponse>('/api/payments/', {
      booking_id: bookingId,
    });
    return data;
  },

  sendWebhook: async (payload: WebhookPayload): Promise<WebhookResponse> => {
    const { data } = await apiClient.post<WebhookResponse>('/api/payments/webhook/', payload);
    return data;
  },
};
