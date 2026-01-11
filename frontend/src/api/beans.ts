import apiClient from './client';

export interface Bean {
  id: number;
  user_id: number;
  variety: string;
  seller?: string;
  roaster?: string;
  roast_level?: string;
  created_at: string;
}

export interface BeanCreate {
  variety: string;
  seller?: string;
  roaster?: string;
  roast_level?: string;
}

export interface BeanUpdate {
  variety?: string;
  seller?: string;
  roaster?: string;
  roast_level?: string;
}

export const beansApi = {
  getAll: async (): Promise<Bean[]> => {
    const response = await apiClient.get('/api/beans/');
    return response.data;
  },

  getById: async (id: number): Promise<Bean> => {
    const response = await apiClient.get(`/api/beans/${id}`);
    return response.data;
  },

  create: async (bean: BeanCreate): Promise<Bean> => {
    const response = await apiClient.post('/api/beans/', bean);
    return response.data;
  },

  update: async (id: number, bean: BeanUpdate): Promise<Bean> => {
    const response = await apiClient.put(`/api/beans/${id}`, bean);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/beans/${id}`);
  },
};
