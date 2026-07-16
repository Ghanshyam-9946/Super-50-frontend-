import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/pms/AuthContext';
import { PageLoader } from './Common';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
  const hasRole = allowedRoles ? allowedRoles.some(role => userRoles.includes(role)) : true;
  if (allowedRoles && !hasRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
