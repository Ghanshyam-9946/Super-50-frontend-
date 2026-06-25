import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, User, Phone, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { updateUser } from '../features/auth/authSlice';

const ProfileEditModal = ({ isOpen, onClose }) => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    whatsapp: '',
    designation: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAdmin = user && user.role !== 'student';

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        whatsapp: user.whatsapp || '',
        designation: user.designation || '',
      });
      // Set existing image preview if available
      if (user.profileImage) {
        setImagePreview(user.profileImage);
      } else {
        setImagePreview(null);
      }
      setProfileImage(null);
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('mobile', formData.mobile);
      data.append('whatsapp', formData.whatsapp);
      if (isAdmin) {
        data.append('designation', formData.designation);
      }
      if (profileImage) {
        data.append('profileImage', profileImage);
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.put(`${API_URL}/api/auth/profile`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        toast.success('Profile updated successfully');
        dispatch(updateUser(res.data.user));
        onClose();
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border-light)] flex justify-between items-center bg-gradient-to-r from-[var(--bg-app)] to-[var(--bg-card)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <User className="text-[var(--primary)]" size={24} />
              Edit Profile
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Image Upload Area */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full border-4 border-[var(--bg-card)] shadow-lg overflow-hidden bg-[var(--bg-app)] flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-[var(--text-secondary)] opacity-50" size={40} />
                  )}
                </div>
                
                <label htmlFor="profileImage" className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="text-white" size={24} />
                </label>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Profile Picture</p>
                <p className="text-xs text-[var(--text-secondary)]">Click image to update (Max 5MB)</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-light)] text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-light)] text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                  placeholder="Enter your email"
                />
              </div>

              {!isAdmin && (
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1.5">
                    Enrollment Number (Fixed)
                  </label>
                  <input
                    type="text"
                    value={user?.enrollmentNumber || user?.enrollmentNo || 'N/A'}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-light)] text-[var(--text-secondary)] opacity-70 cursor-not-allowed"
                  />
                </div>
              )}

              {isAdmin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-light)] text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                        placeholder="Mobile number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                        Designation
                      </label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-light)] text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                        placeholder="E.g. Professor, HOD"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password Management Links */}
              <div className="flex justify-end mt-4 pt-4 border-t border-[var(--border-light)]">
                <a href="/forgot-password" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[var(--primary)] hover:underline">
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-[var(--text-secondary)] bg-[var(--bg-hover)] hover:bg-[var(--border-light)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProfileEditModal;
