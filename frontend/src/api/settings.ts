import apiClient from './client';

export interface UserSettings {
  id: number;
  user_id: number;
  default_machine?: string;
  default_grinder?: string;
}

export interface UserSettingsUpdate {
  default_machine?: string;
  default_grinder?: string;
}

export const settingsApi = {
  get: async (): Promise<UserSettings> => {
    const response = await apiClient.get('/api/users/settings');
    return response.data;
  },

  update: async (settings: UserSettingsUpdate): Promise<UserSettings> => {
    const response = await apiClient.put('/api/users/settings', settings);
    return response.data;
  },
};
