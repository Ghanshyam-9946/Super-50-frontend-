import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMyCertificates = createAsyncThunk('certificates/fetchMine', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/certificates');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch certificates');
  }
});

export const fetchPendingCertificates = createAsyncThunk('certificates/fetchPending', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/certificates/pending');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch pending certificates');
  }
});

export const fetchAllCertificates = createAsyncThunk('certificates/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/certificates/all', { params });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch certificates');
  }
});

export const uploadCertificate = createAsyncThunk('certificates/upload', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/certificates/upload', formData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Upload failed');
  }
});

export const verifyCertificate = createAsyncThunk('certificates/verify', async ({ id, action, rejectionReason }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/certificates/${id}/verify`, { action, rejectionReason });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Verification failed');
  }
});

export const deleteCertificate = createAsyncThunk('certificates/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/certificates/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Delete failed');
  }
});

const certificatesSlice = createSlice({
  name: 'certificates',
  initialState: {
    myCertificates: [],
    pendingCertificates: [],
    allCertificates: [],
    loading: false,
    uploading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyCertificates.pending, (state) => { state.loading = true; })
      .addCase(fetchMyCertificates.fulfilled, (state, action) => {
        state.loading = false; state.myCertificates = action.payload;
      })
      .addCase(fetchMyCertificates.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      .addCase(fetchPendingCertificates.fulfilled, (state, action) => {
        state.pendingCertificates = action.payload;
      })
      .addCase(fetchAllCertificates.fulfilled, (state, action) => {
        state.allCertificates = action.payload;
      })
      .addCase(uploadCertificate.pending, (state) => { state.uploading = true; state.error = null; })
      .addCase(uploadCertificate.fulfilled, (state, action) => {
        state.uploading = false;
        state.myCertificates.unshift(action.payload);
      })
      .addCase(uploadCertificate.rejected, (state, action) => {
        state.uploading = false; state.error = action.payload;
      })
      .addCase(verifyCertificate.fulfilled, (state, action) => {
        const cert = action.payload;
        state.pendingCertificates = state.pendingCertificates.filter((c) => c._id !== cert._id);
        const allIdx = state.allCertificates.findIndex((c) => c._id === cert._id);
        if (allIdx !== -1) state.allCertificates[allIdx] = cert;
      })
      .addCase(deleteCertificate.fulfilled, (state, action) => {
        state.myCertificates = state.myCertificates.filter((c) => c._id !== action.payload);
      });
  },
});

export const { clearError } = certificatesSlice.actions;
export default certificatesSlice.reducer;
