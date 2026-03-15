import api from './axios';

export const createMaintenanceEntry = (data) => api.post('/dms/maintenance', data);
export const getMaintenanceEntries = (params) => api.get('/dms/maintenance', { params });
export const getMaintenanceStats = (params) => api.get('/dms/maintenance/stats', { params });
export const exportMaintenanceExcel = (params) => api.get('/dms/maintenance/export', { params, responseType: 'blob' });
