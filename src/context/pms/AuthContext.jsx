import { useSelector, useDispatch } from 'react-redux';
import { logout as reduxLogout } from '../../features/auth/authSlice';

// Default branding fallback (PMS used a dynamic branding system — we provide safe defaults)
const DEFAULT_BRANDING = {
  appName: 'College PMS',
  appLogo: null,
  primaryColor: '#4f46e5',
};

// Bridge: maps P&T Redux auth state → PMS useAuth() shape
export const useAuth = () => {
  const { user, token, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const logout = () => {
    dispatch(reduxLogout());
  };

  // refreshBranding is a no-op in the merged system (branding is static)
  const refreshBranding = () => {};

  return { user, token, loading, logout, branding: DEFAULT_BRANDING, refreshBranding };
};
