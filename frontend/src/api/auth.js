import api from './axios';

export const login = (phone, password) => api.post('/auth/login', { phone, password });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');