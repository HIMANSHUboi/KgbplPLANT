import api from './axios';

export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const bulkUploadUsers = (formData) => api.post('/users/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});