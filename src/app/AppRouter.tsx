import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from '../auth/LoginPage';
import SignUp from '../auth/SignUp';
import RequireAuth from '../auth/RequireAuth';
import DashboardIndex from '../modules/dashboard/DashboardPage';
import UsersPage from '../modules/admin/UsersPage';
import UserFormPage from '../modules/admin/UserFormPage';
import MainLayout from '../layout/MainLayout';
import { useAuthStore } from '../auth/auth.store';

/** Redirects / to /dashboard when logged in, otherwise to /login */
function RootRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

/** Layout for all routes that require login: auth check + main app shell */
function ProtectedLayout() {
  return (
    <RequireAuth>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </RequireAuth>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signUp" element={<SignUp />} />

        {/* All routes below require login */}
        <Route element={<ProtectedLayout />}>
          <Route path="dashboard" element={<DashboardIndex />} />
          <Route path="index" element={<Navigate to="/dashboard" replace />} />
          <Route path="work-orders" element={<DashboardIndex />} />
          <Route path="scheduling" element={<DashboardIndex />} />
          <Route path="resources" element={<DashboardIndex />} />
          <Route path="materials" element={<DashboardIndex />} />
          <Route path="stock-levels" element={<DashboardIndex />} />
          <Route path="suppliers" element={<DashboardIndex />} />
          <Route path="inspections" element={<DashboardIndex />} />
          <Route path="metrics" element={<DashboardIndex />} />
          <Route path="compliance" element={<DashboardIndex />} />
          <Route path="masters/*" element={<DashboardIndex />} />
          <Route path="receipts/*" element={<DashboardIndex />} />
          <Route path="issues/*" element={<DashboardIndex />} />
          <Route path="reports/*" element={<DashboardIndex />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/add" element={<UserFormPage />} />
          <Route path="users/edit/:id" element={<UserFormPage />} />
          <Route path="settings" element={<DashboardIndex />} />
          <Route path="profile" element={<DashboardIndex />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
