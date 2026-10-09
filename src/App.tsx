import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';
import AuthPage from './pages/AuthPage';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import PatientDashboard from './pages/PatientDashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Consultations from './pages/Consultations';
import MaternalCare from './pages/MaternalCare';
import Vaccinations from './pages/Vaccinations';
import Inventory from './pages/Inventory';
import Schemes from './pages/Schemes';
import HealthEducation from './pages/HealthEducation';
import Reports from './pages/Reports';
import FeedbackPage from './pages/FeedbackPage';

const WORKER_ROLES = ['asha', 'doctor', 'admin'];

function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile && !roles.includes(profile.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ProtectedRoutes() {
  const { profile } = useAuth();
  const isPatient = profile?.role === 'patient';

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={isPatient ? <PatientDashboard /> : <Dashboard />} />
        <Route path="/my-health" element={isPatient ? <PatientDashboard /> : <Navigate to="/" replace />} />
        <Route path="/patients" element={<RoleRoute roles={WORKER_ROLES}><Patients /></RoleRoute>} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/consultations" element={<Consultations />} />
        <Route path="/maternal" element={<MaternalCare />} />
        <Route path="/vaccinations" element={<Vaccinations />} />
        <Route path="/inventory" element={<RoleRoute roles={WORKER_ROLES}><Inventory /></RoleRoute>} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/education" element={<HealthEducation />} />
        <Route path="/reports" element={<RoleRoute roles={['doctor', 'admin']}><Reports /></RoleRoute>} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/*" element={user ? <ProtectedRoutes /> : <Navigate to="/auth" replace />} />
    </Routes>
  );
}
