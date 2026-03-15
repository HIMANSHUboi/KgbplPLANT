import api from './axios';

export const getPerformanceStats = (params) => api.get('/performance', { params });
