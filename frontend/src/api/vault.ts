import api from './client';

export const getVault = () =>
  api.get('/vault').then(r => r.data);

export const addToVault = (data: Record<string, any>) =>
  api.post('/vault', data).then(r => r.data);

export const updateVaultWatch = (id: number, data: Record<string, any>) =>
  api.put(`/vault/${id}`, data).then(r => r.data);

export const removeFromVault = (id: number) =>
  api.delete(`/vault/${id}`).then(r => r.data);
