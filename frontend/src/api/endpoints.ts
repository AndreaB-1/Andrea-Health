import api from './client'
import type {
  DiaryEntry, AnalyzeResult, BiometricLog,
  StatsOverview, DailyStat, UserSettings, User
} from '../types'

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get<User>('/api/auth/me'),
  changePassword: (current_password: string, new_password: string) =>
    api.post('/api/auth/change-password', { current_password, new_password }),
}

// Diary
export const diaryApi = {
  list: (params?: { from?: string; to?: string; type?: string; limit?: number; offset?: number }) =>
    api.get<DiaryEntry[]>('/api/entries', { params }),
  create: (data: { raw_text: string; type?: string }) =>
    api.post<DiaryEntry>('/api/entries', data),
  update: (id: number, data: Partial<DiaryEntry>) =>
    api.put<DiaryEntry>(`/api/entries/${id}`, data),
  delete: (id: number) => api.delete(`/api/entries/${id}`),
  analyze: (text: string) =>
    api.post<AnalyzeResult>('/api/entries/analyze', { text }),
  analyzeAndSave: (text: string) =>
    api.post<DiaryEntry>('/api/entries/analyze-and-save', { text }),
}

// Stats
export const statsApi = {
  overview: (params?: { from?: string; to?: string }) =>
    api.get<StatsOverview>('/api/stats', { params }),
  daily: (params?: { from?: string; to?: string }) =>
    api.get<DailyStat[]>('/api/stats/daily', { params }),
}

// Biometrics
export const biometricsApi = {
  list: (params?: { from?: string; to?: string }) =>
    api.get<BiometricLog[]>('/api/biometrics', { params }),
  latest: () => api.get<BiometricLog | null>('/api/biometrics/latest'),
  create: (data: Partial<BiometricLog>) =>
    api.post<BiometricLog>('/api/biometrics', data),
  delete: (id: number) => api.delete(`/api/biometrics/${id}`),
}

// Settings
export const settingsApi = {
  get: () => api.get<UserSettings>('/api/settings'),
  update: (data: Partial<UserSettings> & { claude_api_key?: string }) =>
    api.put<UserSettings>('/api/settings', data),
}

// Export
export const exportApi = {
  csv: (params?: { from?: string; to?: string }) =>
    api.get('/api/export/csv', { params, responseType: 'blob' }),
  pdf: (params?: { from?: string; to?: string }) =>
    api.get('/api/export/pdf', { params, responseType: 'blob' }),
}

// Telegram
export const telegramApi = {
  test: () => api.post('/api/telegram/test'),
}
