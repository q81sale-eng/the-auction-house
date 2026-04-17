import api from './client';

export const getAdminDashboard = () =>
  api.get('/admin/dashboard').then(r => r.data);

export const getAdminWatches = (params?: Record<string, any>) =>
  api.get('/admin/watches', { params }).then(r => r.data);

export const createWatch = (data: Record<string, any>) =>
  api.post('/admin/watches', data).then(r => r.data);

export const updateWatch = (id: number, data: Record<string, any>) =>
  api.put(`/admin/watches/${id}`, data).then(r => r.data);

export const deleteWatch = (id: number) =>
  api.delete(`/admin/watches/${id}`).then(r => r.data);

export const getAdminAuctions = (params?: Record<string, any>) =>
  api.get('/admin/auctions', { params }).then(r => r.data);

export const createAuction = (data: Record<string, any>) =>
  api.post('/admin/auctions', data).then(r => r.data);

export const updateAuction = (id: number, data: Record<string, any>) =>
  api.put(`/admin/auctions/${id}`, data).then(r => r.data);

export const deleteAuction = (id: number) =>
  api.delete(`/admin/auctions/${id}`).then(r => r.data);

export const getAdminUsers = (params?: Record<string, any>) =>
  api.get('/admin/users', { params }).then(r => r.data);

export const updateUser = (id: number, data: Record<string, any>) =>
  api.put(`/admin/users/${id}`, data).then(r => r.data);

export const deleteUser = (id: number) =>
  api.delete(`/admin/users/${id}`).then(r => r.data);

export const getAdminValuations = (params?: Record<string, any>) =>
  api.get('/admin/valuations', { params }).then(r => r.data);

export const createValuation = (data: Record<string, any>) =>
  api.post('/admin/valuations', data).then(r => r.data);
