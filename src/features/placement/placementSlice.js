import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchStudentPlacementStatus = createAsyncThunk(
  'placement/fetchStudentStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/placement/student/status');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch placement status');
    }
  }
);

export const fetchFacultyPlacementDashboard = createAsyncThunk(
  'placement/fetchFacultyDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/placement/faculty/dashboard');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch faculty dashboard');
    }
  }
);

const placementSlice = createSlice({
  name: 'placement',
  initialState: {
    drives: [],
    studentApplications: [],
    stats: null,
    selections: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearPlacementError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Student status
      .addCase(fetchStudentPlacementStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentPlacementStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.studentApplications = action.payload;
      })
      .addCase(fetchStudentPlacementStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Faculty dashboard
      .addCase(fetchFacultyPlacementDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacultyPlacementDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.drives = action.payload.drives;
        state.stats = action.payload.stats;
        state.selections = action.payload.selections || [];
      })
      .addCase(fetchFacultyPlacementDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPlacementError } = placementSlice.actions;
export default placementSlice.reducer;
