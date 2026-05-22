import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchMyResume = createAsyncThunk(
  'resume/fetchMyResume',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`${API_URL}/resume/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchFacultyReviewQueue = createAsyncThunk(
  'resume/fetchFacultyReviewQueue',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`${API_URL}/resume/faculty/review-queue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    currentResume: null,
    facultyResumes: [],
    loading: false,
    error: null,
  },
  reducers: {
    updateLocalResume: (state, action) => {
      state.currentResume = { ...state.currentResume, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyResume.fulfilled, (state, action) => {
        state.currentResume = action.payload;
      })
      .addCase(fetchFacultyReviewQueue.fulfilled, (state, action) => {
        state.facultyResumes = action.payload;
      });
  },
});

export const { updateLocalResume } = resumeSlice.actions;
export default resumeSlice.reducer;
