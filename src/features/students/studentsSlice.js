import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchLeaderboard = createAsyncThunk('students/fetchLeaderboard', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/students/leaderboard', { params });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch leaderboard');
  }
});

export const fetchAllStudents = createAsyncThunk('students/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/admin/students', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch students');
  }
});

export const fetchAdminStats = createAsyncThunk('students/fetchAdminStats', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/admin/stats');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch stats');
  }
});

export const fetchMyProfile = createAsyncThunk('students/fetchMyProfile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/students/me');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
  }
});

export const createStudent = createAsyncThunk('students/create', async (studentData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/admin/students', studentData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create student');
  }
});

export const toggleStudentStatus = createAsyncThunk('students/toggleStatus', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/admin/students/${id}/toggle-status`);
    return { id, isActive: data.data.isActive };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to toggle status');
  }
});

export const toggleStudentSuper50 = createAsyncThunk('students/toggleSuper50', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/admin/students/${id}/toggle-super50`);
    return { id, isSuper50: data.data.isSuper50 };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to toggle Super 50 status');
  }
});

export const deleteStudent = createAsyncThunk('students/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/students/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete student');
  }
});

export const deleteAllStudents = createAsyncThunk('students/deleteAll', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/admin/students');
    return true;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete all students');
  }
});

const studentsSlice = createSlice({
  name: 'students',
  initialState: {
    leaderboard: [],
    allStudents: [],
    filters: { departments: [], batches: [] },
    adminStats: null,
    myProfile: null,
    loading: false,
    error: null,
    total: 0,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => { state.loading = true; })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      .addCase(fetchAllStudents.fulfilled, (state, action) => {
        state.allStudents = action.payload.data;
        state.total = action.payload.total;
        state.filters = action.payload.filters || { departments: [], batches: [] };
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.adminStats = action.payload;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.myProfile = action.payload;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.allStudents.unshift(action.payload);
        state.total += 1;
      })
      .addCase(toggleStudentStatus.fulfilled, (state, action) => {
        const student = state.allStudents.find((s) => s._id === action.payload.id);
        if (student) student.isActive = action.payload.isActive;
      })
      .addCase(toggleStudentSuper50.fulfilled, (state, action) => {
        const student = state.allStudents.find((s) => s._id === action.payload.id);
        if (student) student.isSuper50 = action.payload.isSuper50;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.allStudents = state.allStudents.filter(s => s._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteAllStudents.fulfilled, (state) => {
        state.allStudents = [];
        state.total = 0;
      });
  },
});

export const { clearError } = studentsSlice.actions;
export default studentsSlice.reducer;
