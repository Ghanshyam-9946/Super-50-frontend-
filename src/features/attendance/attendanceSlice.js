import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const uploadAttendance = createAsyncThunk('attendance/upload', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/attendance/upload', formData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Upload failed');
  }
});

export const fetchAttendanceHistory = createAsyncThunk('attendance/fetchHistory', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/attendance/history');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch history');
  }
});

export const previewBulkStudents = createAsyncThunk('attendance/previewBulk', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/admin/bulk-preview', formData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Preview failed');
  }
});

export const bulkCreateStudents = createAsyncThunk('attendance/bulkCreate', async (students, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/admin/bulk-create', { students });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Bulk create failed');
  }
});

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    history: [],
    lastUploadResult: null,
    bulkPreview: null,
    bulkResult: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    clearBulkPreview: (state) => { state.bulkPreview = null; },
    clearBulkResult: (state) => { state.bulkResult = null; },
    removeStudentFromPreview: (state, action) => {
      if (state.bulkPreview && state.bulkPreview.data) {
        const student = state.bulkPreview.data[action.payload];
        if (student) {
          if (student.alreadyExists) state.bulkPreview.existingCount -= 1;
          else state.bulkPreview.newCount -= 1;
          state.bulkPreview.data.splice(action.payload, 1);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadAttendance.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(uploadAttendance.fulfilled, (state, action) => {
        state.loading = false; state.lastUploadResult = action.payload;
      })
      .addCase(uploadAttendance.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      .addCase(previewBulkStudents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(previewBulkStudents.fulfilled, (state, action) => {
        state.loading = false; state.bulkPreview = action.payload;
      })
      .addCase(previewBulkStudents.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      .addCase(bulkCreateStudents.pending, (state) => { state.loading = true; })
      .addCase(bulkCreateStudents.fulfilled, (state, action) => {
        state.loading = false; state.bulkResult = action.payload; state.bulkPreview = null;
      })
      .addCase(bulkCreateStudents.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      });
  },
});

export const { clearError, clearBulkPreview, clearBulkResult, removeStudentFromPreview } = attendanceSlice.actions;
export default attendanceSlice.reducer;
