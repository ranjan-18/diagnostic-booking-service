import { apiClient } from './client';
import {
  CentreFilterParams,
  DiagnosticCentre,
  DiagnosticTest,
  PaginatedResponse,
  TestFilterParams,
} from '../types';

export const centresApi = {
  getCentres: async (params?: CentreFilterParams): Promise<PaginatedResponse<DiagnosticCentre>> => {
    const { data } = await apiClient.get<PaginatedResponse<DiagnosticCentre>>('/api/centres/', {
      params,
    });
    return data;
  },

  getCentreById: async (id: number): Promise<DiagnosticCentre> => {
    const { data } = await apiClient.get<DiagnosticCentre>(`/api/centres/${id}/`);
    return data;
  },

  getTests: async (params?: TestFilterParams): Promise<PaginatedResponse<DiagnosticTest>> => {
    const { data } = await apiClient.get<PaginatedResponse<DiagnosticTest>>('/api/tests/', {
      params,
    });
    return data;
  },
};
