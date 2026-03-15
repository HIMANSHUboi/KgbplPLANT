import api from './axios';

export const createVehicleEntry = (data) => api.post('/vehicles', data);
export const getVehicles = (params) => api.get('/vehicles', { params });
export const updateVehicleStatus = (id, nextStatus, supplyLoaded) => api.patch(`/vehicles/${id}/status`, { nextStatus, supplyLoaded });
export const getVehicleStats = () => api.get('/vehicles/stats');
export const getVehicleTAT = () => api.get('/vehicles/tat');
