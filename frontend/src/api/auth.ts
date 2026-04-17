import api from './client';

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then(r => r.data);

export const register = (data: {
  name: string; email: string; password: string;
  password_confirmation: string; phone?: string; country?: string;
}) => api.post('/auth/register', data).then(r => r.data);

export const logout = () =>
  api.post('/auth/logout').then(r => r.data);

export const getMe = () =>
  api.get('/auth/me').then(r => r.data);
