import api from './axios';

export const createStoresEntry = (data) => api.post('/dms/stores', data);
export const getStoresEntries = (params) => api.get('/dms/stores', { params });
export const getStoresStats = (params) => api.get('/dms/stores/stats', { params });
export const exportStoresExcel = (params) => api.get('/dms/stores/export', { params, responseType: 'blob' });
