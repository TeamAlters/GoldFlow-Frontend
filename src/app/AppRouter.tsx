import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from '../auth/LoginPage';
import SignUp from '../auth/SignUp';
import RoleAndPermissionPage from '../auth/rolesAndPermission/RoleAndPermissionPage';
import RolesAndPermissionCreatePage from '../auth/rolesAndPermission/rolesAndPermissionCreate';
import RolesAndPermissionViewPage from '../auth/rolesAndPermission/rolesAndPermissionView';
import RolesAndPermissionEditPage from '../auth/rolesAndPermission/rolesAndPermissionEdit';
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
import ProductCategoryPage from '../modules/entities/productCategory/ProductCategoryPage';
import ProductCategoryCreatePage from '../modules/entities/productCategory/productCategoryCreate';
import ProductCategoryEditPage from '../modules/entities/productCategory/productCategoryEdit';
import ProductCategoryViewPage from '../modules/entities/productCategory/productCategoryView';
import PuritiesPage from '../modules/entities/purity/PurityPage';
import PurityCreatePage from '../modules/entities/purity/purityCreate';
import PurityEditPage from '../modules/entities/purity/purityEdit';
import PurityViewPage from '../modules/entities/purity/purityView';
import PurityRangePage from '../modules/entities/purityRange/PurityRangePage';
import PurityRangeCreatePage from '../modules/entities/purityRange/purityRangeCreate';
import PurityRangeEditPage from '../modules/entities/purityRange/purityRangeEdit';
import PurityRangeViewPage from '../modules/entities/purityRange/purityRangeView';
import AccessoryPurityPage from '../modules/entities/accessory_purity/AccessoryPurityPage';
import AccessoryPurityCreatePage from '../modules/entities/accessory_purity/accessoryPurityCreate';
import AccessoryPurityEditPage from '../modules/entities/accessory_purity/accessoryPurityEdit';
import AccessoryPurityViewPage from '../modules/entities/accessory_purity/accessoryPurityView';
import AccessoriesPurityRangePage from '../modules/entities/accessoriesPurityRange/AccessoriesPurityRangePage';
import AccessoriesPurityRangeCreatePage from '../modules/entities/accessoriesPurityRange/accessoriesPurityRangeCreate';
import AccessoriesPurityRangeEditPage from '../modules/entities/accessoriesPurityRange/accessoriesPurityRangeEdit';
import AccessoriesPurityRangeViewPage from '../modules/entities/accessoriesPurityRange/accessoriesPurityRangeView';
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
import CustomerPage from '../modules/entities/customer/CustomerPage';
import CustomerCreatePage from '../modules/entities/customer/customerCreate';
import CustomerEditPage from '../modules/entities/customer/customerEdit';
import CustomerViewPage from '../modules/entities/customer/customerView';
import DepartmentPage from '../modules/entities/department/departmentPage';
import DepartmentCreatePage from '../modules/entities/department/departmentCreate';
import DepartmentEditPage from '../modules/entities/department/departmentEdit';
import DepartmentViewPage from '../modules/entities/department/departmentView';
import DepartmentGroupPage from '../modules/entities/departmentGroup/departmentGroupPage';
import DepartmentGroupCreatePage from '../modules/entities/departmentGroup/departmentGroupCreate';
import DepartmentGroupEditPage from '../modules/entities/departmentGroup/departmentGroupEdit';
import DepartmentGroupViewPage from '../modules/entities/departmentGroup/departmentGroupView';
import ProductDepartmentPage from '../modules/entities/productDepartment/ProductDepartmentPage';
import ProductDepartmentCreatePage from '../modules/entities/productDepartment/productDepartmentCreate';
import ProductDepartmentEditPage from '../modules/entities/productDepartment/productDepartmentEdit';
import ProductDepartmentViewPage from '../modules/entities/productDepartment/productDepartmentView';
import MainLayout from '../layout/MainLayout';
import { useAuthStore } from '../auth/auth.store';
import MetalLedgerPage from '../modules/accounts/metalLedger/MetalLedgerPage';
import MetalLedgerCreatePage from '../modules/accounts/metalLedger/metalLedgerCreate';
import MetalLedgerEditPage from '../modules/accounts/metalLedger/metalLedgerEdit';
import MetalLedgerViewPage from '../modules/accounts/metalLedger/metalLedgerView';
import CustomerMetalLedgerTablePage from '../modules/manufacturing/metalPool/CustomerMetalLedgerTablePage';
import MeltingPoolTransactionPage from '../modules/manufacturing/melting/meltingPoolTransactionPage';
import MeltingPoolTransactionViewPage from '../modules/manufacturing/melting/meltingPoolTransactionView';
import JobCardPage from '../modules/manufacturing/jobCard/JobCardPage';
import JobCardViewPage from '../modules/manufacturing/jobCard/jobCardView';
import JobCardEditPage from '../modules/manufacturing/jobCard/jobCardEdit';
import JobCardTransactionPage from '../modules/manufacturing/jobCardTransaction/jobCardTransactionPage';
import JobCardTransactionViewPage from '../modules/manufacturing/jobCardTransaction/jobCardTransactionView';
import MeltingLotPage from '../modules/manufacturing/meltingLot/meltingLotPage';
import MeltingLotCreatePage from '../modules/manufacturing/meltingLot/meltingLotCreate';
import MeltingLotEditPage from '../modules/manufacturing/meltingLot/meltingLotEdit';
import MeltingLotViewPage from '../modules/manufacturing/meltingLot/meltingLotView';
import ParentMeltingLotPage from '../modules/manufacturing/parentMeltingLot/parentMeltingLotPage';
import ParentMeltingLotCreatePage from '../modules/manufacturing/parentMeltingLot/parentMeltingLotCreate';
import ParentMeltingLotEditPage from '../modules/manufacturing/parentMeltingLot/parentMeltingLotEdit';
import ParentMeltingLotViewPage from '../modules/manufacturing/parentMeltingLot/parentMeltingLotView';
import PageNotFound from './PageNotFound';
import CustomerMetalLedgerBalanceReportPage from '../modules/reports/CustomerMetalLedgerBalanceReportPage';

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
          <Route path="reports/customer-metal-ledger-balance" element={<CustomerMetalLedgerBalanceReportPage />} />
          <Route path="reports/*" element={<DashboardIndex />} />
          <Route path="accounts/customer-metal-ledger" element={<MetalLedgerPage />} />
          <Route path="accounts/customer-metal-ledger-table" element={<CustomerMetalLedgerTablePage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/add" element={<UserCreatePage />} />
          <Route path="users/edit/:id" element={<UserEditPage />} />
          <Route path="users/:id" element={<UserViewPage />} />
          <Route path="roles" element={<RoleAndPermissionPage />} />
          <Route path="roles/add" element={<RolesAndPermissionCreatePage />} />
          <Route path="roles/edit/:id" element={<RolesAndPermissionEditPage />} />
          <Route path="roles/:id" element={<RolesAndPermissionViewPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/add" element={<ProductCreatePage />} />
          <Route path="products/edit/:id" element={<ProductEditPage />} />
          <Route path="products/:id" element={<ProductViewPage />} />
          <Route path="product-categories" element={<ProductCategoryPage />} />
          <Route path="product-categories/add" element={<ProductCategoryCreatePage />} />
          <Route path="product-categories/edit/:id" element={<ProductCategoryEditPage />} />
          <Route path="product-categories/:id" element={<ProductCategoryViewPage />} />
          <Route path="purities" element={<PuritiesPage />} />
          <Route path="purities/add" element={<PurityCreatePage />} />
          <Route path="purities/edit/:id" element={<PurityEditPage />} />
          <Route path="purities/:id" element={<PurityViewPage />} />
          <Route path="purity-ranges" element={<PurityRangePage />} />
          <Route path="purity-ranges/add" element={<PurityRangeCreatePage />} />
          <Route path="purity-ranges/edit/:id" element={<PurityRangeEditPage />} />
          <Route path="purity-ranges/:id" element={<PurityRangeViewPage />} />
          <Route path="accessory-purities" element={<AccessoryPurityPage />} />
          <Route path="accessory-purities/add" element={<AccessoryPurityCreatePage />} />
          <Route path="accessory-purities/edit/:id" element={<AccessoryPurityEditPage />} />
          <Route path="accessory-purities/:id" element={<AccessoryPurityViewPage />} />
          <Route path="accessories-purity-ranges" element={<AccessoriesPurityRangePage />} />
          <Route path="accessories-purity-ranges/add" element={<AccessoriesPurityRangeCreatePage />} />
          <Route path="accessories-purity-ranges/edit/:id" element={<AccessoriesPurityRangeEditPage />} />
          <Route path="accessories-purity-ranges/:id" element={<AccessoriesPurityRangeViewPage />} />
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
          <Route path="customers" element={<CustomerPage />} />
          <Route path="customers/add" element={<CustomerCreatePage />} />
          <Route path="customers/edit/:id" element={<CustomerEditPage />} />
          <Route path="customers/:id" element={<CustomerViewPage />} />
          <Route path="departments" element={<DepartmentPage />} />
          <Route path="departments/add" element={<DepartmentCreatePage />} />
          <Route path="departments/edit/:id" element={<DepartmentEditPage />} />
          <Route path="departments/:id" element={<DepartmentViewPage />} />
          <Route path="product-department-groups" element={<DepartmentGroupPage />} />
          <Route path="product-department-groups/add" element={<DepartmentGroupCreatePage />} />
          <Route path="product-department-groups/edit/:id" element={<DepartmentGroupEditPage />} />
          <Route path="product-department-groups/:id" element={<DepartmentGroupViewPage />} />
          <Route path="product-departments" element={<ProductDepartmentPage />} />
          <Route path="product-departments/add" element={<ProductDepartmentCreatePage />} />
          <Route path="product-departments/edit/:id" element={<ProductDepartmentEditPage />} />
          <Route path="product-departments/:id" element={<ProductDepartmentViewPage />} />
          <Route path="metal-pool" element={<CustomerMetalLedgerTablePage />} />
          <Route path="melting-pool-transaction" element={<MeltingPoolTransactionPage />} />
          <Route path="melting-pool-transaction/:id" element={<MeltingPoolTransactionViewPage />} />
          <Route path="job-card" element={<JobCardPage />} />
          <Route path="job-card/edit/:id" element={<JobCardEditPage />} />
          <Route path="job-card/:id" element={<JobCardViewPage />} />
          <Route path="job-card-transaction" element={<JobCardTransactionPage />} />
          <Route path="job-card-transaction/:id" element={<JobCardTransactionViewPage />} />
          <Route path="melting-lot" element={<MeltingLotPage />} />
          <Route path="melting-lot/add" element={<MeltingLotCreatePage />} />
          <Route path="melting-lot/edit/:id" element={<MeltingLotEditPage />} />
          <Route path="melting-lot/:id" element={<MeltingLotViewPage />} />
          <Route path="parent-melting-lot" element={<ParentMeltingLotPage />} />
          <Route path="parent-melting-lot/add" element={<ParentMeltingLotCreatePage />} />
          <Route path="parent-melting-lot/edit/:id" element={<ParentMeltingLotEditPage />} />
          <Route path="parent-melting-lot/:id" element={<ParentMeltingLotViewPage />} />
          <Route path="metal-ledger" element={<MetalLedgerPage />} />
          <Route path="metal-ledger/add" element={<MetalLedgerCreatePage />} />
          <Route path="metal-ledger/edit/:id" element={<MetalLedgerEditPage />} />
          <Route path="metal-ledger/:id" element={<MetalLedgerViewPage />} />
          <Route path="settings" element={<DashboardIndex />} />
          <Route path="profile" element={<DashboardIndex />} />
          <Route path="404" element={<PageNotFound />} />
          {/* Catch-all — must be last */}
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
