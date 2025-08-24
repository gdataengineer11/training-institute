// client/src/lib/inventoryApi.js
import api from './axios';

export const getMeta = () => api.get('/inventory/meta').then(r => r.data);

export const listItems = (params) => api.get('/inventory', { params }).then(r => r.data);
export const getItem   = (id) => api.get(`/inventory/${id}`).then(r => r.data);

export const createItem = (formData) =>
  api.post('/inventory', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

export const updateItem = (id, formData) =>
  api.put(`/inventory/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

export const archiveItem = (id) => api.delete(`/inventory/${id}`).then(r => r.data);

export const issueStock   = (id, payload) => api.post(`/inventory/${id}/issue`, payload).then(r => r.data);
export const receiveStock = (id, payload) => api.post(`/inventory/${id}/receive`, payload).then(r => r.data);
export const adjustStock  = (id, payload) => api.post(`/inventory/${id}/adjust`, payload).then(r => r.data);
export const returnStock  = (id, payload) => api.post(`/inventory/${id}/return`, payload).then(r => r.data);
export const disposeStock = (id, payload) => api.post(`/inventory/${id}/dispose`, payload).then(r => r.data);

export const bulkAction = (action, ids, payload) =>
  api.post('/inventory/bulk', { action, ids, payload }).then(r => r.data);

export const exportItems = (params, format = 'csv') =>
  api.get('/inventory/export', { params: { ...params, format }, responseType: 'blob' });

export const importCsv = (file) => {
  const fd = new FormData(); fd.append('file', file);
  return api.post('/inventory/import', fd).then(r => r.data);
};
