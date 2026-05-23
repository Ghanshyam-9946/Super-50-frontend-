import api from '../../services/api';

// ============ AUTH ============
export const authAPI = {
  login: (data) => api.post('/pms/auth/login', data),
  logout: () => api.post('/pms/auth/logout'),
  me: () => api.get('/pms/auth/me'),
};

// ============ ADMIN ============
export const adminAPI = {
  dashboard: () => api.get('/pms/admin/dashboard'),
  publicSettings: () => api.get('/pms/admin/public-settings'),

  // Years
  listYears: () => api.get('/pms/admin/years'),
  createYear: (data) => api.post('/pms/admin/years', data),
  setActiveYear: (id) => api.put(`/pms/admin/years/${id}/activate`),
  deleteYear: (id) => api.delete(`/pms/admin/years/${id}`),

  // Projects
  listProjects: () => api.get('/pms/admin/projects'),
  createProject: (data) => api.post('/pms/admin/projects', data),
  deleteProject: (id) => api.delete(`/pms/admin/projects/${id}`),

  // Presentations
  listPresentations: () => api.get('/pms/admin/presentations'),
  createPresentation: (data) => api.post('/pms/admin/presentations', data),
  deletePresentation: (id) => api.delete(`/pms/admin/presentations/${id}`),

  // Guides
  listGuides: () => api.get('/pms/admin/guides'),
  createGuide: (data) => api.post('/pms/admin/guides', data),
  deleteGuide: (id) => api.delete(`/pms/admin/guides/${id}`),

  // Students
  listStudents: () => api.get('/pms/admin/students'),
  createStudent: (data) => api.post('/pms/admin/students', data),          // 🆕
  updateStudent: (id, data) => api.put(`/pms/admin/students/${id}`, data), // 🆕
  toggleStudent: (id) => api.put(`/pms/admin/students/${id}/toggle`),
  deleteStudent: (id) => api.delete(`/pms/admin/students/${id}`),
  bulkUploadStudents: (formData) =>
    api.post('/pms/admin/students/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  sampleTemplateUrl: '/api/pms/admin/students/sample-template',

  // Promote
  bulkPromote: (data) => api.post('/pms/admin/promote/bulk', data),
  selectivePromote: (data) => api.post('/pms/admin/promote/selective', data),

  // Teams
  listTeams: (params) => api.get('/pms/admin/teams', { params }),
  updateTeam: (id, data) => api.put(`/pms/admin/teams/${id}`, data),
  deleteTeam: (id) => api.delete(`/pms/admin/teams/${id}`),
  toggleTeamLock: (id) => api.put(`/pms/admin/teams/${id}/lock`),   // 🆕
  assignGuide: (teamId, guideId) => api.put(`/pms/admin/teams/${teamId}/assign-guide`, { guideId }),

  // Attendance
  attendanceOverview: (params) => api.get('/pms/admin/attendance', { params }),

  // Reports
  reports: (params) => api.get('/pms/admin/reports', { params }),

  // Settings
  getSettings: () => api.get('/pms/admin/settings'),
  updateSettings: (formData) =>
    api.put('/pms/admin/settings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // 🆕 Guidelines (admin edit)
  getGuidelines: () => api.get('/pms/admin/guidelines'),
  updateGuidelines: (guidelines) => api.put('/pms/admin/guidelines', { guidelines }),

  // 🆕 Template files (admin upload/manage)
  listTemplates: () => api.get('/pms/admin/templates'),
  uploadTemplate: (formData) =>
    api.post('/pms/admin/templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateTemplate: (id, data) => api.put(`/pms/admin/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/pms/admin/templates/${id}`),
  templateDownloadUrl: (id) => `/api/pms/student/templates/${id}/download`, // admin can also use student route

  // 🆕 Progress overview (all teams)
  progressOverview: (params) => api.get('/pms/admin/progress-overview', { params }),

  // 🆕 Admin search students (for team-edit picker)
  searchAvailableStudents: (params) => api.get('/pms/admin/students/search-available', { params }),

  // 🆕 Semester Attendance bulk upload
  listSemesterAttendance: (params) => api.get('/pms/admin/semester-attendance', { params }),
  uploadSemesterAttendance: (formData) =>
    api.post('/pms/admin/semester-attendance/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteSemesterAttendance: (id) => api.delete(`/pms/admin/semester-attendance/${id}`),
  bulkDeleteSemesterAttendance: (data) => api.post('/pms/admin/semester-attendance/bulk-delete', data),
  semesterAttendanceSampleUrl: '/api/pms/admin/semester-attendance/sample-template',

  // 🆕 PDF download URLs (direct browser navigation works because cookies travel)
  initiationFormUrl: (teamId) => `/api/pms/admin/teams/${teamId}/initiation-form.pdf`,
  bulkInitiationFormsUrl: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return `/api/pms/admin/initiation-forms.pdf${q ? `?${q}` : ''}`;
  },
  guideAllotmentUrl: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return `/api/pms/admin/guide-allotment.pdf${q ? `?${q}` : ''}`;
  },
};

// ============ STUDENT ============
export const studentAPI = {
  dashboard: () => api.get('/pms/student/dashboard'),
  suggestSDG: (projectTitle) => api.post('/pms/student/suggest-sdg', { projectTitle }),
  getMyTeam: () => api.get('/pms/student/team'),
  createTeam: (data) => api.post('/pms/student/team', data),
  updateMyTeam: (data) => api.put('/pms/student/team', data),
  searchStudents: (q) => api.get('/pms/student/team/search-students', { params: { q } }),  // 🆕
  proposeLeader: (proposedLeaderId) => api.post('/pms/student/team/propose-leader', { proposedLeaderId }),
  voteLeader: (vote) => api.post('/pms/student/team/vote-leader', { vote }),
  getPresentations: () => api.get('/pms/student/presentations'),
  submitPresentation: (formData) =>
    api.post('/pms/student/presentations/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMarks: () => api.get('/pms/student/marks'),
  getRubricMarks: () => api.get('/pms/student/rubric-marks'),
  getGuidelines: () => api.get('/pms/student/guidelines'),
  // 🆕 Progress
  getProgress: () => api.get('/pms/student/progress'),
  updateProgressMeta: (data) => api.put('/pms/student/progress', data),
  addTask: (data) => api.post('/pms/student/progress/tasks', data),
  updateTask: (taskId, data) => api.put(`/pms/student/progress/tasks/${taskId}`, data),
  deleteTask: (taskId) => api.delete(`/pms/student/progress/tasks/${taskId}`),
  addMilestone: (data) => api.post('/pms/student/progress/milestones', data),
  updateMilestone: (id, data) => api.put(`/pms/student/progress/milestones/${id}`, data),
  deleteMilestone: (id) => api.delete(`/pms/student/progress/milestones/${id}`),
  postUpdate: (data) => api.post('/pms/student/progress/updates', data),
  // 🆕 Code runner
  runCode: (data) => api.post('/pms/student/code/run', data, { timeout: 60000 }),
  getLanguages: () => api.get('/pms/student/code/languages'),
  getCodeDiagnostics: () => api.get('/pms/student/code/diagnostics'),
  // 🆕 Templates
  listTemplates: () => api.get('/pms/student/templates'),
  templateDownloadUrl: (id) => `/api/pms/student/templates/${id}/download`,

  // 🆕 Online Project Report
  getReport: () => api.get('/pms/student/report'),
  updateReport: (data) => api.put('/pms/student/report', data),
  submitReport: () => api.post('/pms/student/report/submit'),
  reportDownloadUrl: '/api/pms/student/report/download',
};

// ============ GUIDE ============
export const guideAPI = {
  dashboard: () => api.get('/pms/guide/dashboard'),
  getMyGroups: () => api.get('/pms/guide/groups'),
  getTeamForReview: (teamId) => api.get(`/pms/guide/review/${teamId}`),
  reviewSubmission: (data) => api.post('/pms/guide/review', data),
  getAttendance: (params) => api.get('/pms/guide/attendance', { params }),
  markAttendance: (data) => api.post('/pms/guide/attendance', data),
  reports: () => api.get('/pms/guide/reports'),
  // 🆕 Rubric Evaluation
  getRubrics: (teamId) => api.get(`/pms/guide/rubrics/${teamId}`),
  saveRubrics: (data) => api.post('/pms/guide/rubrics', data),
  rubricPdfUrl: (teamId) => `/api/pms/guide/rubrics/${teamId}/pdf`,
  bulkRubricsPdfUrl: () => `/api/pms/guide/rubrics-all/pdf`,
  // 🆕 Status
  getAllGroupsStatus: () => api.get('/pms/guide/status'),
  getGroupStatus: (teamId) => api.get(`/pms/guide/status/${teamId}`),
};

// ============ NOTIFICATIONS ============
export const notificationsAPI = {
  list: (params) => api.get('/pms/notifications', { params }),
  recent: () => api.get('/pms/notifications/recent'),
  markRead: (id) => api.put(`/pms/notifications/${id}/read`),
  markAllRead: () => api.put('/pms/notifications/mark-all-read'),
  remove: (id) => api.delete(`/pms/notifications/${id}`),
  clearAll: () => api.delete('/pms/notifications/clear-all'),
};
