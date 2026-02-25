// Navigation Configuration - Add new menu items here
// This config is used by both Navbar and Sidebar

export type NavItem = {
  name: string;
  path: string;
  icon?: string; // Icon name reference
  entityName?: string; // Entity for metadata API (e.g. "user" for All Users)
};

export type NavCategory = {
  id: string;
  category: string;
  icon: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

export type NavbarMenuItem = {
  name: string;
  path: string;
};

// Top Navbar Menu Items
export const navbarMenuItems: NavbarMenuItem[] = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Reports', path: '/reports' },
  { name: 'Settings', path: '/settings' },
];

// Sidebar Navigation Configuration
export const sidebarNavConfig: NavCategory[] = [
  {
    id: 'production',
    category: 'Production',
    icon: 'dashboard',
    defaultOpen: true,
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: 'home' },
      { name: 'Work Orders', path: '/work-orders', icon: 'clipboard' },
      { name: 'Scheduling', path: '/scheduling', icon: 'calendar' },
      { name: 'Resources', path: '/resources', icon: 'users' },
    ],
  },
  {
    id: 'masters',
    category: 'Masters',
    icon: 'database',
    defaultOpen: true,
    items: [
      { name: 'Purities', path: '/purities', icon: 'sparkles', entityName: 'purity' },
      { name: 'Purity Range', path: '/purity-ranges', icon: 'ruler', entityName: 'purity_range' },
      { name: 'Accessory Purity', path: '/accessory-purities', icon: 'sparkles', entityName: 'accessory_purity' },
      { name: 'Accessories Purity Range', path: '/accessories-purity-ranges', icon: 'ruler', entityName: 'accessories_purity_range' },
      { name: 'Thickness', path: '/thickness', icon: 'ruler', entityName: 'thickness' },
      { name: 'Design', path: '/designs', icon: 'pencil', entityName: 'design' },
      { name: 'Product', path: '/products', icon: 'box', entityName: 'product' },
      { name: 'Product Category', path: '/product-categories', icon: 'layers', entityName: 'product_category' },
      { name: 'Wire Size', path: '/wire-sizes', icon: 'ruler', entityName: 'wire_size' },
      { name: 'Machine', path: '/machines', icon: 'cog', entityName: 'machine' },
      { name: 'Item', path: '/items', icon: 'tag', entityName: 'item' },
      { name: 'Item Type', path: '/item-types', icon: 'layers', entityName: 'item_type' },
      { name: 'Karigar', path: '/karigars', icon: 'users', entityName: 'karigar' },
      { name: 'Customer', path: '/customers', icon: 'user', entityName: 'customer' },
      { name: 'Department', path: '/departments', icon: 'user', entityName: 'department' },
      { name: 'Department Group', path: '/product-department-groups', icon: 'layers', entityName: 'product_department_group' },
    ],
  },
  {
    id: 'manufacturing',
    category: 'Manufacturing',
    icon: 'package',
    items: [
      { name: 'Metal Pool', path: '/metal-pool', icon: 'box' },
      { name: 'Melting Pool Transaction', path: '/melting-pool-transaction', icon: 'box', entityName: 'melting_pool_transaction' },
      { name: 'Melting Lots', path: '/melting-lot', icon: 'box', entityName: 'melting_lot' },
      { name: 'Parent Melting Lots', path: '/parent-melting-lot', icon: 'box', entityName: 'parent_melting_lot' },
    ],
  },
  {
    id: 'accounts',
    category: 'Accounts',
    icon: 'package',
    items: [
      { name: 'Metal-Ledger', path: '/metal-ledger', icon: 'box' },
    ],
  },
    {
    id: 'users',
    category: 'Users',
    icon: 'user',
    items: [
      { name: 'All Users', path: '/users', icon: 'list', entityName: 'user' },
      { name: 'Roles & Permissions', path: '/roles', icon: 'key' },
    ],
  },
  {
    id: 'reports',
    category: 'Reports',
    icon: 'file-text',
    items: [
      { name: 'Vatav Report', path: '/reports/vatav-report', icon: 'file' },
      { name: 'Receipt Report', path: '/reports/receipt-report', icon: 'file' },
      { name: 'Stock Management', path: '/reports/stock-management', icon: 'archive' },
    ],
  },
];

// User Management (for admin users)
export const adminNavConfig: NavCategory = {
  id: 'user-management',
  category: 'User Management',
  icon: 'users-cog',
  items: [
    { name: 'All Users', path: '/users', icon: 'users' },
    { name: 'Roles & Permissions', path: '/roles', icon: 'key' },
  ],
};
