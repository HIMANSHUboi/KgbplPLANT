import api from './axios';

export const getSKUs = (params) => api.get('/skus', { params });
export const createSKU = (data) => api.post('/skus', data);
export const updateSKU = (id, data) => api.patch(`/skus/${id}`, data);
