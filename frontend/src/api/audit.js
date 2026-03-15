import api from './axios';

export const getAlerts = (params) => api.get('/alerts', { params });
export const markAlertRead = (id) => api.patch(`/alerts/${id}/read`);
export const getUnreadCount = () => api.get('/alerts/unread-count');
export const deleteAlert = (id) => api.delete(`/alerts/${id}`);
export const bulkDeleteAlerts = (ids) => api.post('/alerts/bulk-delete', { ids });
export const getAuditLogs = (params) => api.get('/audit', { params });
