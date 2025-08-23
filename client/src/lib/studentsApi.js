import api from './axios';

export const fetchMeta = () => api.get('/students/meta').then(r=>r.data);

export function listStudents(params) {
  return api.get('/students', { params }).then(r=>r.data);
}

export function createStudent(payload) {
  return api.post('/students', payload).then(r=>r.data);
}

export function updateStudent(id, payload) {
  return api.put(`/students/${id}`, payload).then(r=>r.data);
}

export function bulkAction(action, ids, payload) {
  return api.post('/students/bulk', { action, ids, payload }).then(r=>r.data);
}

export function exportStudents(params, format='csv') {
  return api.get('/students/export', { params: { ...params, format }, responseType: 'blob' }).then(r=>r);
}
