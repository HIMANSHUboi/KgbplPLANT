import api from './axios';

export const getLines = (params) => api.get('/lines', { params });
export const createLine = (data) => api.post('/lines', data);
export const updateLine = (id, data) => api.patch(`/lines/${id}`, data);
export const getEquipment = (lineId) => api.get(`/lines/${lineId}/equipment`);
export const addEquipment = (lineId, data) => api.post(`/lines/${lineId}/equipment`, data);
