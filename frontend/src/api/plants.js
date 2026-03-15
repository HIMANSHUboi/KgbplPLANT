import api from './axios';

export const getPlants = () => api.get('/plants');
export const createPlant = (data) => api.post('/plants', data);
export const updatePlant = (id, data) => api.patch(`/plants/${id}`, data);
