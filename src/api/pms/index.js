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
  updateYear: (id, data) => api.put(`/pms/admin/years/${id}`, data),
  setActiveYear: (id) => api.put(`/pms/admin/years/${id}/activate`),
  deleteYear: (id) => api.delete(`/pms/admin/years/${id}`),

  // Projects
  listProjects: () => api.get('/pms/admin/projects'),
  createProject: (data) => api.post('/pms/admin/projects', data),
  updateProject: (id, data) => api.put(`/pms/admin/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/pms/admin/projects/${id}`),

  // Presentations
  listPresentations: () => api.get('/pms/admin/presentations'),
  createPresentation: (data) => api.post('/pms/admin/presentations', data),
  updatePresentation: (id, data) => api.put(`/pms/admin/presentations/${id}`, data),
  deletePresentation: (id) => api.delete(`/pms/admin/presentations/${id}`),

  // 🆕 Team Configuration (min/max team size, max teams per guide) +
  // Allocation Sheet finalize/unlock
  getTeamConfig: (params) => api.get('/pms/admin/team-config', { params }),
  upsertTeamConfig: (data) => api.put('/pms/admin/team-config', data),
  setAllocationFinalized: (data) => api.patch('/pms/admin/team-config/finalize', data),

  // 🆕 Admin daily attendance marking (group-wise + student-wise, any team)
  getAttendanceForTeam: (teamId) => api.get(`/pms/admin/attendance/team/${teamId}`),
  markAttendance: (data) => api.post('/pms/admin/attendance', data),

  // Guides — tagging an existing faculty account, never creating a new one
  listGuides: () => api.get('/pms/admin/guides'),
  listFacultyCandidates: () => api.get('/pms/admin/guides/candidates'),
  assignGuideRole: (data) => api.post('/pms/admin/guides', data),
  removeGuideRole: (id) => api.delete(`/pms/admin/guides/${id}`),

  // Students — read-only view (create/edit/bulk-upload/delete happen in the
  // main admin panel, not in PMS), optionally filtered by batch/semester
  listStudents: (params) => api.get('/pms/admin/students', { params }),

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
  templateDownloadUrl: (id) => `/pms/student/templates/${id}/download`, // admin can also use student route

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
  semesterAttendanceSampleUrl: '/pms/admin/semester-attendance/sample-template',

  // PDF/file download paths — relative to the shared `api` instance's own
  // baseURL (which already includes `/api`), consumed via downloadFile()
  // (utils/downloadFile.js) rather than raw <a href> navigation. A bare
  // <a href> can't carry the Bearer token this app actually uses (login
  // never sets an auth cookie), so every one of these previously 401'd
  // silently on click.
  initiationFormUrl: (teamId) => `/pms/admin/teams/${teamId}/initiation-form.pdf`,
  bulkInitiationFormsUrl: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return `/pms/admin/initiation-forms.pdf${q ? `?${q}` : ''}`;
  },
  guideAllotmentUrl: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return `/pms/admin/guide-allotment.pdf${q ? `?${q}` : ''}`;
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
  templateDownloadUrl: (id) => `/pms/student/templates/${id}/download`,

  // 🆕 Online Project Report
  getReport: () => api.get('/pms/student/report'),
  updateReport: (data) => api.put('/pms/student/report', data),
  submitReport: () => api.post('/pms/student/report/submit'),
  reportDownloadUrl: '/pms/student/report/download',
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
  rubricPdfUrl: (teamId) => `/pms/guide/rubrics/${teamId}/pdf`,
  bulkRubricsPdfUrl: () => `/pms/guide/rubrics-all/pdf`,
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
