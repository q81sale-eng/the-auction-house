import api from './client';

export const getListings = (params?: Record<string, any>) =>
  api.get('/marketplace', { params }).then(r => r.data);

export const getListing = (slug: string) =>
  api.get(`/marketplace/${slug}`).then(r => r.data);
