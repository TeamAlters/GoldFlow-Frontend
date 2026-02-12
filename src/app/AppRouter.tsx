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
import ThicknessPage from '../modules/entities/thickness/ThicknessPage';
import ThicknessCreatePage from '../modules/entities/thickness/thicknessCreate';
import ThicknessEditPage from '../modules/entities/thickness/thicknessEdit';
import ThicknessViewPage from '../modules/entities/thickness/thicknessView';
import WireSizePage from '../modules/entities/wireSize/WireSizePage';
import WireSizeCreatePage from '../modules/entities/wireSize/wireSizeCreate';
import WireSizeEditPage from '../modules/entities/wireSize/wireSizeEdit';
import WireSizeViewPage from '../modules/entities/wireSize/wireSizeView';
import MachinePage from '../modules/entities/machine/MachinePage';
import MachineCreatePage from '../modules/entities/machine/machineCreate';
import MachineEditPage from '../modules/entities/machine/machineEdit';
import MachineViewPage from '../modules/entities/machine/machineView';
import ItemPage from '../modules/entities/itemName/ItemPage';
import ItemCreatePage from '../modules/entities/itemName/itemCreate';
import ItemEditPage from '../modules/entities/itemName/itemEdit';
import ItemViewPage from '../modules/entities/itemName/itemView';
import ItemTypePage from '../modules/entities/itemType/ItemTypePage';
import ItemTypeCreatePage from '../modules/entities/itemType/itemTypeCreate';
import ItemTypeEditPage from '../modules/entities/itemType/itemTypeEdit';
import ItemTypeViewPage from '../modules/entities/itemType/itemTypeView';
import KarigarPage from '../modules/entities/karigar/karigarPage';
import KarigarCreatePage from '../modules/entities/karigar/karigarCreate';
import KarigarEditPage from '../modules/entities/karigar/karigarEdit';
import KarigarViewPage from '../modules/entities/karigar/karigarView';
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
          <Route path="thickness" element={<ThicknessPage />} />
          <Route path="thickness/add" element={<ThicknessCreatePage />} />
          <Route path="thickness/edit/:id" element={<ThicknessEditPage />} />
          <Route path="thickness/:id" element={<ThicknessViewPage />} />
          <Route path="wire-sizes" element={<WireSizePage />} />
          <Route path="wire-sizes/add" element={<WireSizeCreatePage />} />
          <Route path="wire-sizes/edit/:id" element={<WireSizeEditPage />} />
          <Route path="wire-sizes/:id" element={<WireSizeViewPage />} />
          <Route path="machines" element={<MachinePage />} />
          <Route path="machines/add" element={<MachineCreatePage />} />
          <Route path="machines/edit/:id" element={<MachineEditPage />} />
          <Route path="machines/:id" element={<MachineViewPage />} />
          <Route path="items" element={<ItemPage />} />
          <Route path="items/add" element={<ItemCreatePage />} />
          <Route path="items/edit/:id" element={<ItemEditPage />} />
          <Route path="items/:id" element={<ItemViewPage />} />
          <Route path="item-types" element={<ItemTypePage />} />
          <Route path="item-types/add" element={<ItemTypeCreatePage />} />
          <Route path="item-types/edit/:id" element={<ItemTypeEditPage />} />
          <Route path="item-types/:id" element={<ItemTypeViewPage />} />
          <Route path="karigars" element={<KarigarPage />} />
          <Route path="karigars/add" element={<KarigarCreatePage />} />
          <Route path="karigars/edit/:id" element={<KarigarEditPage />} />
          <Route path="karigars/:id" element={<KarigarViewPage />} />
          <Route path="settings" element={<DashboardIndex />} />
          <Route path="profile" element={<DashboardIndex />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
