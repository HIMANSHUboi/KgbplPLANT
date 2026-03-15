import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import AppLayout from './components/AppLayout';
import DemoPopup from './components/DemoPopup';
import LoginPage from './pages/LoginPage';
import AppHubPage from './pages/AppHubPage';
import DashboardPage from './pages/DashboardPage';
import SubmitEntryPage from './pages/SubmitEntryPage';
import MyEntriesPage from './pages/MyEntriesPage';
import ReviewPage from './pages/ReviewPage';
import UsersPage from './pages/UsersPage';
import ExportPage from './pages/ExportPage';
import ProfilePage from './pages/ProfilePage';
import AuditLogPage from './pages/AuditLogPage';
import AlertsPage from './pages/AlertsPage';
import GuidePage from './pages/GuidePage';

// DMS App Pages
import ProductionEntryPage from './pages/apps/ProductionEntryPage';
import ProductionDashboard from './pages/apps/ProductionDashboard';
import QseEntryPage from './pages/apps/QseEntryPage';
import QseDashboard from './pages/apps/QseDashboard';
import MaintenanceEntryPage from './pages/apps/MaintenanceEntryPage';
import MaintenanceDashboard from './pages/apps/MaintenanceDashboard';
import HrEntryPage from './pages/apps/HrEntryPage';
import HrDashboard from './pages/apps/HrDashboard';
import StoresEntryPage from './pages/apps/StoresEntryPage';
import StoresDashboard from './pages/apps/StoresDashboard';
import AppHistoryPage from './pages/apps/AppHistoryPage';
import ReviewDmsPage from './pages/apps/ReviewDmsPage';
import PerformanceDashboard from './pages/PerformanceDashboard';
import VehicleTrackingApp from './pages/apps/VehicleTrackingApp';

const SUPERVISORS = ['SHIFT_SUPERVISOR', 'PLANT_MANAGER', 'ADMIN', 'GLOBAL_ADMIN'];
const MANAGERS = ['PLANT_MANAGER', 'ADMIN', 'GLOBAL_ADMIN'];
const ADMINS = ['ADMIN', 'GLOBAL_ADMIN'];

const APP_ENTRY = {
  production: ProductionEntryPage,
  qse: QseEntryPage,
  maintenance: MaintenanceEntryPage,
  hr: HrEntryPage,
  stores: StoresEntryPage,
};

const APP_DASH = {
  production: ProductionDashboard,
  qse: QseDashboard,
  maintenance: MaintenanceDashboard,
  hr: HrDashboard,
  stores: StoresDashboard,
};

function DmsEntryRouter() {
  const { appId } = useParams();
  const Component = APP_ENTRY[appId];
  return Component ? <Component /> : <Navigate to="/hub" replace />;
}

function DmsDashRouter() {
  const { appId } = useParams();
  const Component = APP_DASH[appId];
  return Component ? <Component /> : <Navigate to="/hub" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/hub" replace />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Hub is the new default landing */}
          <Route index element={<Navigate to="/hub" replace />} />
          <Route path="hub" element={<AppHubPage />} />

          {/* Overview dashboard (existing) */}
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Existing shift log pages */}
          <Route path="submit" element={<ProtectedRoute><SubmitEntryPage /></ProtectedRoute>} />
          <Route path="my-entries" element={<ProtectedRoute><MyEntriesPage /></ProtectedRoute>} />
          <Route path="review" element={<ProtectedRoute roles={SUPERVISORS}><ReviewPage /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute roles={ADMINS}><UsersPage /></ProtectedRoute>} />
          <Route path="export" element={<ProtectedRoute roles={MANAGERS}><ExportPage /></ProtectedRoute>} />
          <Route path="alerts" element={<ProtectedRoute roles={SUPERVISORS}><AlertsPage /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="audit-log" element={<ProtectedRoute roles={ADMINS}><AuditLogPage /></ProtectedRoute>} />
          <Route path="guide" element={<GuidePage />} />
          <Route path="review-dms" element={<ProtectedRoute roles={SUPERVISORS}><ReviewDmsPage /></ProtectedRoute>} />
          <Route path="performance" element={<ProtectedRoute roles={ADMINS}><PerformanceDashboard /></ProtectedRoute>} />

          {/* Vehicle Tracking App */}
          <Route path="app/vehicles/*" element={<VehicleTrackingApp />} />

          {/* DMS App routes */}
          <Route path="app/:appId" element={<AppLayout />}>
            <Route index element={<Navigate to="enter" replace />} />
            <Route path="enter" element={<DmsEntryRouter />} />
            <Route path="dashboard" element={<DmsDashRouter />} />
            <Route path="history" element={<AppHistoryPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/hub" replace />} />
      </Routes>
      <DemoPopup />
    </ErrorBoundary>
  );
}