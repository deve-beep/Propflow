import api from './api';

export const authService = {
  registerCustomer: (data) => api.post('/auth/register', data),
  registerCompany: (data) => api.post('/auth/register-company', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.post(`/auth/verify-email/${token}`),
  changePassword: (data) => api.post('/auth/change-password', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
  inviteStaff: (data) => api.post('/auth/invite', data),
};

export const propertyService = {
  list: (params) => api.get('/properties', { params }),
  getOne: (idOrSlug) => api.get(`/properties/${idOrSlug}`),
  getMap: (params) => api.get('/properties/map', { params }),
  listStaff: (params) => api.get('/properties/staff', { params }),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.patch(`/properties/${id}`, data),
  updateStatus: (id, status) => api.patch(`/properties/${id}/status`, { status }),
  remove: (id) => api.delete(`/properties/${id}`),
  uploadImages: (id, formData) =>
    api.post(`/properties/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleFavorite: (id) => api.post(`/properties/${id}/favorite`),
  listFavorites: () => api.get('/properties/favorites'),
  compare: (ids) => api.post('/properties/compare', { ids }),
};

export const leadService = {
  list: (params) => api.get('/leads', { params }),
  getPipeline: (params) => api.get('/leads/pipeline', { params }),
  getOne: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.patch(`/leads/${id}`, data),
  updateStatus: (id, status) => api.patch(`/leads/${id}/status`, { status }),
  addNote: (id, text) => api.post(`/leads/${id}/notes`, { text }),
  getActivity: (id) => api.get(`/leads/${id}/activity`),
  archive: (id) => api.delete(`/leads/${id}`),
};

export const appointmentService = {
  list: (params) => api.get('/appointments', { params }),
  request: (data) => api.post('/appointments', data),
  updateStatus: (id, data) => api.patch(`/appointments/${id}/status`, data),
};

export const dealService = {
  list: (params) => api.get('/deals', { params }),
  create: (data) => api.post('/deals', data),
  updateStage: (id, data) => api.patch(`/deals/${id}/stage`, data),
};

export const agentService = {
  list: (params) => api.get('/agents', { params }),
  getOne: (id) => api.get(`/agents/${id}`),
  getPerformance: (id) => api.get(`/agents/${id}/performance`),
  update: (id, data) => api.patch(`/agents/${id}`, data),
};

export const developerService = {
  list: (params) => api.get('/developers', { params }),
  getOne: (id) => api.get(`/developers/${id}`),
  create: (data) => api.post('/developers', data),
};

export const projectService = {
  list: (params) => api.get('/projects', { params }),
  getOne: (idOrSlug) => api.get(`/projects/${idOrSlug}`),
  create: (data) => api.post('/projects', data),
  addBuilding: (id, data) => api.post(`/projects/${id}/buildings`, data),
  listUnits: (id, buildingId, params) => api.get(`/projects/${id}/buildings/${buildingId}/units`, { params }),
  addUnits: (id, buildingId, data) => api.post(`/projects/${id}/buildings/${buildingId}/units`, data),
};

export const unitService = {
  updateStatus: (unitId, status) => api.patch(`/units/${unitId}/status`, { status }),
};

export const analyticsService = {
  getCrmDashboard: () => api.get('/analytics/dashboard'),
  getCompanyAnalytics: () => api.get('/analytics/company'),
  getPlatformAnalytics: () => api.get('/analytics/platform'),
};

export const messageService = {
  listConversations: () => api.get('/messages/conversations'),
  startConversation: (data) => api.post('/messages/conversations', data),
  getMessages: (conversationId, params) => api.get(`/messages/conversations/${conversationId}`, { params }),
};

export const notificationService = {
  list: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const documentService = {
  list: (params) => api.get('/documents', { params }),
  upload: (formData) => api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/documents/${id}`),
};

export const investmentService = {
  emi: (data) => api.post('/investment/emi', data),
  rentalYield: (data) => api.post('/investment/rental-yield', data),
  appreciation: (data) => api.post('/investment/appreciation', data),
  roi: (data) => api.post('/investment/roi', data),
};

export const aiService = {
  query: (query) => api.post('/ai/query', { query }),
};

export const companyService = {
  list: (params) => api.get('/companies', { params }),
  getMine: () => api.get('/companies/me'),
  updateMine: (data) => api.patch('/companies/me', data),
  listStaff: () => api.get('/companies/staff'),
};

export const reportService = {
  download: (reportType, format = 'csv') =>
    api.get(`/reports/${reportType}`, { params: { format }, responseType: 'blob' }),
};
