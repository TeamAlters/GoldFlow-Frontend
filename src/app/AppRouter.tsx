import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from '../auth/LoginPage';
import SignUp from '../auth/SignUp';
import RequireAuth from '../auth/RequireAuth';
import DashboardIndex from '../modules/dashboard/DashboardPage';
import UsersPage from '../modules/entities/users/UsersPage';
import UserCreatePage from '../modules/entities/users/userCreate';
import UserEditPage from '../modules/entities/users/userEdit';
import UserViewPage from '../modules/entities/users/userView';
import ProductsPage from '../modules/entities/products/ProductsPage';
import ProductCreatePage from '../modules/entities/products/productCreate';
import ProductEditPage from '../modules/entities/products/productEdit';
import ProductViewPage from '../modules/entities/products/productView';
import PuritiesPage from '../modules/entities/purity/PurityPage';
import PurityCreatePage from '../modules/entities/purity/purityCreate';
import PurityEditPage from '../modules/entities/purity/purityEdit';
import PurityViewPage from '../modules/entities/purity/purityView';
import DesignsPage from '../modules/entities/design/DesignsPage';
import DesignCreatePage from '../modules/entities/design/designCreate';
import DesignEditPage from '../modules/entities/design/designEdit';
import DesignViewPage from '../modules/entities/design/designView';
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
          <Route path="users/add" element={<UserCreatePage />} />
          <Route path="users/edit/:id" element={<UserEditPage />} />
          <Route path="users/:id" element={<UserViewPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/add" element={<ProductCreatePage />} />
          <Route path="products/edit/:id" element={<ProductEditPage />} />
          <Route path="products/:id" element={<ProductViewPage />} />
          <Route path="purities" element={<PuritiesPage />} />
          <Route path="purities/add" element={<PurityCreatePage />} />
          <Route path="purities/edit/:id" element={<PurityEditPage />} />
          <Route path="purities/:id" element={<PurityViewPage />} />
          <Route path="designs" element={<DesignsPage />} />
          <Route path="designs/add" element={<DesignCreatePage />} />
          <Route path="designs/edit/:id" element={<DesignEditPage />} />
          <Route path="designs/:id" element={<DesignViewPage />} />
          <Route path="settings" element={<DashboardIndex />} />
          <Route path="profile" element={<DashboardIndex />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
