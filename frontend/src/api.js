import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const TOKEN_KEY = 'attendance.token';

export async function setToken(token) {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}
export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const token = await getToken();
  const h = { ...headers };
  if (!isForm) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: h,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const ctype = res.headers.get('content-type') || '';
  const data = ctype.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (data && data.error) || res.statusText || 'Request failed';
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // auth
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: () => request('/api/auth/me'),

  // profile
  getProfile: () => request('/api/profile'),
  updateProfile: (payload) => request('/api/profile', { method: 'PATCH', body: payload }),
  changePassword: (payload) =>
    request('/api/profile/change-password', { method: 'POST', body: payload }),

  // attendance
  checkIn: (formData) =>
    request('/api/attendance/check-in', { method: 'POST', body: formData, isForm: true }),
  today: () => request('/api/attendance/today'),
  myAttendance: (q = '') => request(`/api/attendance/me${q}`),
  mySummary: () => request('/api/attendance/me/summary'),

  // holidays
  holidays: (year) => request(`/api/holidays${year ? `?year=${year}` : ''}`),
  createHoliday: (payload) => request('/api/holidays', { method: 'POST', body: payload }),
  deleteHoliday: (id) => request(`/api/holidays/${id}`, { method: 'DELETE' }),

  // admin
  adminStats: () => request('/api/admin/stats'),
  adminRequests: (status = 'pending') => request(`/api/admin/requests?status=${status}`),
  decideRequest: (id, action, reason) =>
    request(`/api/admin/requests/${id}`, { method: 'POST', body: { action, reason } }),
  adminEmployees: () => request('/api/admin/employees'),
  adminAttendance: (q = '') => request(`/api/admin/attendance${q}`),
  removeEmployee: (id) => request(`/api/admin/employees/${id}`, { method: 'DELETE' }),
};
