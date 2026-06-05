import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMyActivities = createAsyncThunk('activities/fetchMine', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/activities', { params });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch activities');
  }
});

export const fetchPendingActivities = createAsyncThunk('activities/fetchPending', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/activities/pending');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch pending activities');
  }
});

export const verifyActivity = createAsyncThunk('activities/verify', async ({ id, action, rejectionReason }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/activities/${id}/verify`, { action, rejectionReason });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Verification failed');
  }
});

export const addActivity = createAsyncThunk('activities/add', async (activityData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/activities', activityData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add activity');
  }
});

export const deleteActivity = createAsyncThunk('activities/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/activities/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete activity');
  }
});

const activitiesSlice = createSlice({
  name: 'activities',
  initialState: {
    myActivities: [],
    pendingActivities: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyActivities.pending, (state) => { state.loading = true; })
      .addCase(fetchMyActivities.fulfilled, (state, action) => {
        state.loading = false; state.myActivities = action.payload;
      })
      .addCase(fetchMyActivities.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      .addCase(addActivity.fulfilled, (state, action) => {
        state.myActivities.unshift(action.payload);
      })
      .addCase(deleteActivity.fulfilled, (state, action) => {
        state.myActivities = state.myActivities.filter((a) => a._id !== action.payload);
      })
      .addCase(fetchPendingActivities.fulfilled, (state, action) => {
        state.pendingActivities = action.payload;
      })
      .addCase(verifyActivity.fulfilled, (state, action) => {
        const activity = action.payload;
        state.pendingActivities = state.pendingActivities.filter((a) => a._id !== activity._id);
        const allIdx = state.myActivities.findIndex((a) => a._id === activity._id);
        if (allIdx !== -1) state.myActivities[allIdx] = activity;
      });
  },
});

export const { clearError } = activitiesSlice.actions;
export default activitiesSlice.reducer;
