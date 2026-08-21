import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthToken } from './hooks/useAuthToken';
import DevLogin from './pages/DevLogin';
import AdminDashboard from './pages/AdminDashboard';
import ScanAttendance from './pages/ScanAttendance';

function RequireRole({ allow, children }) {
  const { token, role } = useAuthToken();
  if (!token || !allow.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DevLogin />} />
        <Route
          path="/admin"
          element={
            <RequireRole allow={['admin']}>
              <AdminDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/scan"
          element={
            <RequireRole allow={['student', 'admin']}>
              <ScanAttendance />
            </RequireRole>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
