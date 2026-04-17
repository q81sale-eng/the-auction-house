import api from './client';

export const getAuctions = (params?: Record<string, any>) =>
  api.get('/auctions', { params }).then(r => r.data);

export const getAuction = (slug: string) =>
  api.get(`/auctions/${slug}`).then(r => r.data);

export const getBidHistory = (auctionId: number, params?: Record<string, any>) =>
  api.get(`/auctions/${auctionId}/bids`, { params }).then(r => r.data);

export const placeBid = (auctionId: number, amount: number) =>
  api.post(`/auctions/${auctionId}/bid`, { amount }).then(r => r.data);

export const buyNow = (auctionId: number) =>
  api.post(`/auctions/${auctionId}/buy-now`).then(r => r.data);
