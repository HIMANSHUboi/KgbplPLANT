import api from './axios';

export const getShiftLogs = (params) => api.get('/shift-logs', { params });
export const createShiftLog = (data) => api.post('/shift-logs', data);
export const updateLogStatus = (id, status) => api.patch(`/shift-logs/${id}/status`, { status });
export const getPlantStats = (params) => api.get('/shift-logs/stats', { params });
export const exportLogs = (params) => api.get('/shift-logs/export', { params, responseType: 'blob' });