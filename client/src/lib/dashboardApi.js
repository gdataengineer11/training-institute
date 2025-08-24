import api from './axios'

export const getSummary  = () => api.get('/dashboard/summary').then(r => r.data)
export const getKpis     = (params) => api.get('/dashboard/kpis', { params }).then(r => r.data)
export const getTrend    = (params) => api.get('/dashboard/enrollments-trend', { params }).then(r => r.data)
export const getRecent   = (params) => api.get('/dashboard/recent-enrollments', { params }).then(r => r.data)
