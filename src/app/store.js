import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import studentsReducer from '../features/students/studentsSlice';
import certificatesReducer from '../features/certificates/certificatesSlice';
import activitiesReducer from '../features/activities/activitiesSlice';
import attendanceReducer from '../features/attendance/attendanceSlice';
import placementReducer from '../features/placement/placementSlice';
import resumeReducer from '../features/resume/resumeSlice';
import projectReducer from '../features/project/projectSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentsReducer,
    certificates: certificatesReducer,
    activities: activitiesReducer,
    attendance: attendanceReducer,
    placement: placementReducer,
    resume: resumeReducer,
    project: projectReducer,
  },
});

export default store;
