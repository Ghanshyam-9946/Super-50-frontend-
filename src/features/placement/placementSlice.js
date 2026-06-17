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

export const submitFeedback = createAsyncThunk(
  'placement/submitFeedback',
  async (feedbackData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/placement/feedback', feedbackData);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit feedback');
    }
  }
);

export const fetchDriveFeedbacks = createAsyncThunk(
  'placement/fetchDriveFeedbacks',
  async (driveId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/placement/drives/${driveId}/feedbacks`);
      return { driveId, feedbacks: data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch drive feedbacks');
    }
  }
);

export const fetchAllFeedbacks = createAsyncThunk(
  'placement/fetchAllFeedbacks',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/placement/feedbacks');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all feedbacks');
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
    feedbacks: [],
    driveFeedbacks: {},
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
      })
      // Submit feedback
      .addCase(submitFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.loading = false;
        const feedback = action.payload;
        state.feedbacks.unshift(feedback);
        if (state.driveFeedbacks[feedback.drive]) {
          state.driveFeedbacks[feedback.drive].unshift(feedback);
        } else {
          state.driveFeedbacks[feedback.drive] = [feedback];
        }
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch drive feedbacks
      .addCase(fetchDriveFeedbacks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDriveFeedbacks.fulfilled, (state, action) => {
        state.loading = false;
        const { driveId, feedbacks } = action.payload;
        state.driveFeedbacks[driveId] = feedbacks;
      })
      .addCase(fetchDriveFeedbacks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch all feedbacks
      .addCase(fetchAllFeedbacks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllFeedbacks.fulfilled, (state, action) => {
        state.loading = false;
        state.feedbacks = action.payload;
      })
      .addCase(fetchAllFeedbacks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPlacementError } = placementSlice.actions;
export default placementSlice.reducer;
