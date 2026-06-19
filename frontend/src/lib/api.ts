import axios from 'axios';
import { clearAuthStorage } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearAuthStorage();
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Teams
export const teamsAPI = {
  getAll: (params?: Record<string, string>) => api.get('/teams', { params }),
  getById: (id: string) => api.get(`/teams/${id}`),
  register: (data: FormData) =>
    api.post('/teams/register', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  approve: (id: string) => api.put(`/teams/${id}/approve`),
  reject: (id: string, reason: string) => api.put(`/teams/${id}/reject`, { reason }),
  getRankings: () => api.get('/teams/rankings'),
};

// Players
export const playersAPI = {
  getAll: (params?: Record<string, string>) => api.get('/players', { params }),
  getById: (id: string) => api.get(`/players/${id}`),
  getUnassigned: () => api.get('/players/unassigned'),
  register: (data: FormData) =>
    api.post('/players/register', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    api.put(`/players/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  assignToTeam: (id: string, teamId: string) => api.put(`/players/${id}/assign-team`, { teamId }),
  removeFromTeam: (id: string) => api.put(`/players/${id}/remove-team`),
  delete: (id: string) => api.delete(`/players/${id}`),
  getTopBatsmen: (limit = 10) => api.get('/players/top/batsmen', { params: { limit } }),
  getTopBowlers: (limit = 10) => api.get('/players/top/bowlers', { params: { limit } }),
  getRankings: (type = 'batting') => api.get('/players/rankings', { params: { type } }),
  verify: (id: string) => api.put(`/players/${id}/verify`),
};

// Tournaments
export const tournamentsAPI = {
  getAll: (params?: Record<string, string>) => api.get('/tournaments', { params }),
  getById: (id: string) => api.get(`/tournaments/${id}`),
  getUpcoming: () => api.get('/tournaments/upcoming'),
  create: (data: FormData) =>
    api.post('/tournaments', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    api.put(`/tournaments/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/tournaments/${id}`),
  approveTeam: (id: string, teamId: string) =>
    api.put(`/tournaments/${id}/approve-team`, { teamId }),
};

// Matches
export const matchesAPI = {
  getAll: (params?: Record<string, string>) => api.get('/matches', { params }),
  getById: (id: string) => api.get(`/matches/${id}`),
  getScorecard: (id: string) => api.get(`/matches/${id}/scorecard`),
  getScorecardHistory: (id: string) => api.get(`/matches/${id}/scorecard/history`),
  getLatest: () => api.get('/matches/latest'),
  create: (data: Record<string, unknown>) => api.post('/matches', data),
  updateScorecard: (id: string, data: Record<string, unknown>) =>
    api.put(`/matches/${id}/scorecard`, data),
  approveScorecard: (id: string) => api.post(`/matches/${id}/scorecard/approve`),
  updateLive: (id: string, data: Record<string, unknown>) => api.put(`/matches/${id}/live`, data),
  delete: (id: string) => api.delete(`/matches/${id}`),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: () => api.get('/admin/analytics'),
  getPendingTeams: () => api.get('/admin/pending-teams'),
  getUnverifiedPlayers: () => api.get('/admin/unverified-players'),
  getUsers: () => api.get('/admin/users'),
};

// Contact
export const contactAPI = {
  submit: (data: { name: string; email: string; phone: string; subject: string; message: string }) =>
    api.post('/contact', data),
  getMessages: () => api.get('/contact'),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};
