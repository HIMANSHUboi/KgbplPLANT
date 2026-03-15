import api from './axios';

export const createProductionEntry = (data) => api.post('/dms/production', data);
export const getProductionEntries = (params) => api.get('/dms/production', { params });
export const getProductionStats = (params) => api.get('/dms/production/stats', { params });
export const exportProductionExcel = (params) => api.get('/dms/production/export', { params, responseType: 'blob' });
export const reviewProductionEntry = (id, status) => api.put(`/dms/production/${id}/review`, { status });

