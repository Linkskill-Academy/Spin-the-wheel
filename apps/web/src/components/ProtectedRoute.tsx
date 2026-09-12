import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading, connectionError, refreshUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softbg">
        <p className="text-muted">Loading your progress...</p>
      </div>
    );
  }

  if (!user && connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softbg px-4">
        <div className="card max-w-sm text-center">
          <p className="font-bold text-ink mb-2">Can't reach the server right now</p>
          <p className="text-sm text-muted mb-4">Your session is still saved. Check your connection and try again.</p>
          <button onClick={() => refreshUser()} className="btn-primary w-full">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
}
