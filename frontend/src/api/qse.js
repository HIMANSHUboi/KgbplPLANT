import api from './axios';

export const createQseEntry = (type, data) => api.post(`/dms/${type}`, data);
export const getQseEntries = (params) => api.get('/dms/qse', { params });
export const getQseStats = (params) => api.get('/dms/qse/stats', { params });
export const exportQseExcel = (params) => api.get('/dms/qse/export', { params, responseType: 'blob' });
