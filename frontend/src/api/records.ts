import apiClient from './client';

export interface EspressoRecord {
  id: number;
  user_id: number;
  bean_id: number;
  machine: string;
  grinder: string;
  grind_size?: string;
  dose?: number;
  extraction_time?: number;
  yield_amount?: number;
  rating?: number;
  sourness?: number;
  bitterness?: number;
  sweetness?: number;
  notes?: string;
  created_at: string;
}

export interface EspressoRecordCreate {
  bean_id: number;
  machine: string;
  grinder: string;
  grind_size?: string;
  dose?: number;
  extraction_time?: number;
  yield_amount?: number;
  rating?: number;
  sourness?: number;
  bitterness?: number;
  sweetness?: number;
  notes?: string;
}

export interface EspressoRecordUpdate {
  machine?: string;
  grinder?: string;
  grind_size?: string;
  dose?: number;
  extraction_time?: number;
  yield_amount?: number;
  rating?: number;
  sourness?: number;
  bitterness?: number;
  sweetness?: number;
  notes?: string;
}

export interface SearchParams {
  bean_id?: number;
  machine?: string;
  grinder?: string;
  bean_variety?: string;
  bean_roaster?: string;
}

export const recordsApi = {
  getAll: async (params?: SearchParams): Promise<EspressoRecord[]> => {
    const response = await apiClient.get('/api/records/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<EspressoRecord> => {
    const response = await apiClient.get(`/api/records/${id}`);
    return response.data;
  },

  create: async (record: EspressoRecordCreate): Promise<EspressoRecord> => {
    const response = await apiClient.post('/api/records/', record);
    return response.data;
  },

  update: async (id: number, record: EspressoRecordUpdate): Promise<EspressoRecord> => {
    const response = await apiClient.put(`/api/records/${id}`, record);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/records/${id}`);
  },
};
