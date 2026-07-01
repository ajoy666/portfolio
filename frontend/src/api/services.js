import api from './axios'

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/admin/auth/logout'),
  me: () => api.get('/admin/auth/me'),
}

// ─── About ───────────────────────────────────────────────────
export const aboutApi = {
  get: () => api.get('/about'),
  update: (data) => api.put('/admin/about', data),
}

// ─── Experiences ─────────────────────────────────────────────
export const experienceApi = {
  list: () => api.get('/admin/experiences'),
  create: (data) => api.post('/admin/experiences', data),
  update: (id, data) => api.put(`/admin/experiences/${id}`, data),
  destroy: (id) => api.delete(`/admin/experiences/${id}`),
  reorder: (order) => api.patch('/admin/experiences/reorder', toReorderPayload(order)),
};

// ─── CV Generator ─────────────────────────────────────────────
export const cvApi = {
  getStatus: () => api.get('/admin/cv/status'),
  generate: () => api.post('/admin/cv/generate'),
};

// ─── Reorder ─────────────────────────────────────────────────
const toReorderPayload = (order) => ({
  items: order.map((id, index) => ({
    id,
    order: index,
  })),
})

// ─── Projects ────────────────────────────────────────────────
export const projectApi = {
  list: () => api.get('/admin/projects'),
  create: (data) => api.post('/admin/projects', data),
  update: (id, data) => api.put(`/admin/projects/${id}`, data),
  destroy: (id) => api.delete(`/admin/projects/${id}`),
  reorder: (order) => api.patch('/admin/projects/reorder', toReorderPayload(order)),

  uploadScreenshots: async (projectId, files = []) => {
    const uploads = files.map((file, index) => {
      const form = new FormData();

      form.append('screenshot', file);
      form.append('caption', '');
      form.append('is_thumbnail', index === 0 ? 'true' : 'false');
      form.append('order', String(index));

      return api.post(`/admin/projects/${projectId}/screenshots`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });

    return Promise.all(uploads);
  },
  reorderScreenshots: (projectId, order) =>
    api.patch(`/admin/projects/${projectId}/screenshots/reorder`, toReorderPayload(order)),
  setThumbnail: (screenshotId) => api.patch(`/admin/screenshots/${screenshotId}/thumbnail`),
  deleteScreenshot: (screenshotId) => api.delete(`/admin/screenshots/${screenshotId}`),
};

// ─── Skills ──────────────────────────────────────────────────
export const skillApi = {
  list: () => api.get('/skills'),

  createCategory: (data) => api.post('/admin/skill-categories', data),
  updateCategory: (id, data) => api.put(`/admin/skill-categories/${id}`, data),
  destroyCategory: (id) => api.delete(`/admin/skill-categories/${id}`),
  reorderCategories: (order) =>
    api.patch('/admin/skill-categories/reorder', toReorderPayload(order)),
  reorderSkills: (order) =>
    api.patch('/admin/skills/reorder', toReorderPayload(order)),

  create: (data) => api.post('/admin/skills', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/admin/skills/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  destroy: (id) => api.delete(`/admin/skills/${id}`),
}

// ─── Social Links ────────────────────────────────────────────
export const socialApi = {
  list: () => api.get('/admin/social-links'),
  create: (data) => api.post('/admin/social-links', data),
  update: (id, data) => api.put(`/admin/social-links/${id}`, data),
  destroy: (id) => api.delete(`/admin/social-links/${id}`),
  reorder: (order) =>
    api.patch('/admin/social-links/reorder', toReorderPayload(order)),
}

// ─── Contacts ────────────────────────────────────────────────
export const contactApi = {
  list: () => api.get('/admin/contacts'),
  show: (id) => api.get(`/admin/contacts/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/admin/contacts/${id}/status`, { status }),
  destroy: (id) => api.delete(`/admin/contacts/${id}`),
}