import api from './axios';

export const createHrEntry = (data) => api.post('/dms/hr', data);
export const getHrEntries = (params) => api.get('/dms/hr', { params });
export const getHrStats = (params) => api.get('/dms/hr/stats', { params });
export const exportHrExcel = (params) => api.get('/dms/hr/export', { params, responseType: 'blob' });
