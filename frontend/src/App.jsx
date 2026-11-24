import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import TcLoader from './components/ui/TcLoader';

// ── Public pages (eager loaded — small) ──────────────────────────────────────
import LandingPage     from './pages/landing/LandingPage';
import LoginPage       from './pages/auth/LoginPage';
import RegisterPage    from './pages/auth/RegisterPage';
import PublicTrackPage from './pages/tracking/PublicTrackPage';

// ── Authenticated pages (lazy loaded) ────────────────────────────────────────
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const SendParcelPage    = lazy(() => import('./pages/customer/SendParcelPage'));
const CustomerShipments = lazy(() => import('./pages/customer/CustomerShipmentsPage'));
const ClerkDashboard    = lazy(() => import('./pages/clerk/ClerkDashboard'));
const DriverDashboard   = lazy(() => import('./pages/driver/DriverDashboard'));
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));

function AppLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <TcLoader size="lg" message="Loading Transcage..." />
    </div>
  );
}

// Guard: redirect to login if not authenticated
function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, activeRole, initializing } = useAuth();
  if (initializing) return <AppLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    // Redirect to appropriate dashboard
    if (activeRole === 'PLATFORM_ADMIN') return <Navigate to="/admin" replace />;
    if (activeRole === 'STATION_CLERK' || activeRole === 'STATION_STAFF') return <Navigate to="/station" replace />;
    if (activeRole === 'DRIVER')         return <Navigate to="/driver" replace />;
    return <Navigate to="/app/shipments" replace />;
  }
  return children;
}

// Guard: redirect away from login/register if already authenticated
function GuestRoute({ children }) {
  const { isAuthenticated, activeRole, initializing } = useAuth();
  if (initializing) return <AppLoader />;
  if (isAuthenticated) {
    if (activeRole === 'PLATFORM_ADMIN') return <Navigate to="/admin" replace />;
    if (activeRole === 'STATION_CLERK' || activeRole === 'STATION_STAFF') return <Navigate to="/station" replace />;
    if (activeRole === 'DRIVER')         return <Navigate to="/driver" replace />;
    return <Navigate to="/app/shipments" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<AppLoader />}>
      <Routes>
        {/* ── Public ─────────────────────────────────────────────────────── */}
        <Route path="/"             element={<LandingPage />} />
        <Route path="/track"        element={<PublicTrackPage />} />
        <Route path="/track/:ref"   element={<PublicTrackPage />} />

        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* ── Customer ───────────────────────────────────────────────────── */}
        <Route path="/app" element={
          <PrivateRoute allowedRoles={['CUSTOMER','DRIVER','STATION_CLERK','OVERSEER','COMPANY_OWNER','COMPANY_ADMIN','PLATFORM_ADMIN']}>
            <CustomerDashboard />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="shipments" replace />} />
          <Route path="shipments" element={<CustomerShipments />} />
          <Route path="send"      element={<SendParcelPage />} />
          <Route path="track"     element={<PublicTrackPage inApp />} />
          <Route path="track/:ref" element={<PublicTrackPage inApp />} />
        </Route>

        {/* ── Station Clerk ──────────────────────────────────────────────── */}
        <Route path="/station/*" element={
          <PrivateRoute allowedRoles={['STATION_CLERK','STATION_STAFF','OVERSEER','COMPANY_ADMIN','PLATFORM_ADMIN']}>
            <ClerkDashboard />
          </PrivateRoute>
        } />

        {/* ── Driver ─────────────────────────────────────────────────────── */}
        <Route path="/driver/*" element={
          <PrivateRoute allowedRoles={['DRIVER','PLATFORM_ADMIN']}>
            <DriverDashboard />
          </PrivateRoute>
        } />

        {/* ── Platform Admin ─────────────────────────────────────────────── */}
        <Route path="/admin/*" element={
          <PrivateRoute allowedRoles={['PLATFORM_ADMIN']}>
            <AdminDashboard />
          </PrivateRoute>
        } />

        {/* ── Catch-all ──────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
