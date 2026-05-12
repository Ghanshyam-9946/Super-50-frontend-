import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import studentsReducer from '../features/students/studentsSlice';
import certificatesReducer from '../features/certificates/certificatesSlice';
import activitiesReducer from '../features/activities/activitiesSlice';
import attendanceReducer from '../features/attendance/attendanceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentsReducer,
    certificates: certificatesReducer,
    activities: activitiesReducer,
    attendance: attendanceReducer,
  },
});

export default store;
