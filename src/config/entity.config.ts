/**
 * Entity Configuration
 *
 * Centralized configuration for all dynamic entities in the system.
 * Each entity can have custom API endpoints, display names, and other metadata.
 *
 * Usage:
 * - Use getEntityConfig('user') to get configuration for a specific entity
 * - Add new entities by adding entries to the ENTITY_CONFIG object
 * - Override environment variables per entity if needed
 */

export type EntityConfig = {
  /** Internal entity identifier (used in routes and API calls) */
  name: string;

  /** Display name shown in UI */
  displayName: string;

  /** Plural form for UI (e.g., "Users", "Products") */
  displayNamePlural: string;

  /** API endpoint paths - can use {entity_name} placeholder which will be replaced with entity name */
  api: {
    /** GET listing metadata endpoint (for table columns and filters) */
    listingMetadata: string;

    /** GET form metadata endpoint (for form fields and validation) */
    formMetadata: string;

    /** GET list endpoint */
    list: string;

    /** POST create endpoint (optional for read-only entities) */
    create?: string;

    /** GET single item endpoint (use {id} or {entity_id} placeholder) */
    get: string;

    /** PUT/PATCH update endpoint (optional for read-only entities) */
    update?: string;

    /** DELETE endpoint (optional for read-only entities) */
    delete?: string;
  };

  /** Route paths in the app */
  routes: {
    /** List page route */
    list: string;

    /** Add new item route (optional for read-only entities) */
    add?: string;

    /** Edit item route (optional for read-only entities) */
    edit?: string;

    /** Detail/view item route (use :id for route param) */
    detail: string;
  };

  /** Optional: Enable/disable specific features */
  features?: {
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canExport?: boolean;
  };
};

/**
 * Get base URL from environment
 */
const getBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL ?? '';
};

/**
 * Default API endpoint templates (can be overridden per entity)
 * These can be customized via environment variables or per-entity config
 */
const DEFAULT_API_PATHS = {
  listingMetadata: '/api/v1/entities/{entity_name}/listing-metadata',
  formMetadata: '/api/v1/entities/{entity_name}/form-metadata',
  list: '/api/v1/entities/{entity_name}/list',
  create: '/api/v1/entities/{entity_name}',
  get: '/api/v1/entities/{entity_name}/{entity_id}',
  update: '/api/v1/entities/{entity_name}/{entity_id}',
  delete: '/api/v1/entities/{entity_name}/{entity_id}',
};

/** Path for dropdown/reference options: GET /api/v1/entities/references/{entity_name} */
export const ENTITY_REFERENCES_PATH = '/api/v1/entities/references/{entity_name}';

/**
 * Entity configurations
 * Add new entities here to make them available throughout the app
 */
const ENTITY_CONFIG: Record<string, Omit<EntityConfig, 'name'>> = {
  user: {
    displayName: 'User',
    displayNamePlural: 'Users',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/users',
      add: '/users/add',
      edit: '/users/edit/:id',
      detail: '/users/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  // Example: Add more entities as needed
  product: {
    displayName: 'Product',
    displayNamePlural: 'Products',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/products',
      add: '/products/add',
      edit: '/products/edit/:id',
      detail: '/products/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: true,
    },
  },

  product_category: {
    displayName: 'Product Category',
    displayNamePlural: 'Product Categories',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/product-categories',
      add: '/product-categories/add',
      edit: '/product-categories/edit/:id',
      detail: '/product-categories/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  purity: {
    displayName: 'Purity',
    displayNamePlural: 'Purities',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/purities',
      add: '/purities/add',
      edit: '/purities/edit/:id',
      detail: '/purities/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  purity_range: {
    displayName: 'Purity Range',
    displayNamePlural: 'Purity Ranges',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/purity-ranges',
      add: '/purity-ranges/add',
      edit: '/purity-ranges/edit/:id',
      detail: '/purity-ranges/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  accessory_purity: {
    displayName: 'Accessory Purity',
    displayNamePlural: 'Accessory Purities',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/accessory-purities',
      add: '/accessory-purities/add',
      edit: '/accessory-purities/edit/:id',
      detail: '/accessory-purities/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  accessories_purity_range: {
    displayName: 'Accessories Purity Range',
    displayNamePlural: 'Accessories Purity Ranges',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/accessories-purity-ranges',
      add: '/accessories-purity-ranges/add',
      edit: '/accessories-purity-ranges/edit/:id',
      detail: '/accessories-purity-ranges/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  design: {
    displayName: 'Design',
    displayNamePlural: 'Designs',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/designs',
      add: '/designs/add',
      edit: '/designs/edit/:id',
      detail: '/designs/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  thickness: {
    displayName: 'Thickness',
    displayNamePlural: 'Thicknesses',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/thickness',
      add: '/thickness/add',
      edit: '/thickness/edit/:id',
      detail: '/thickness/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  wire_size: {
    displayName: 'Wire Size',
    displayNamePlural: 'Wire Sizes',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/wire-sizes',
      add: '/wire-sizes/add',
      edit: '/wire-sizes/edit/:id',
      detail: '/wire-sizes/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  machine: {
    displayName: 'Machine',
    displayNamePlural: 'Machines',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/machines',
      add: '/machines/add',
      edit: '/machines/edit/:id',
      detail: '/machines/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  item: {
    displayName: 'Item',
    displayNamePlural: 'Items',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/items',
      add: '/items/add',
      edit: '/items/edit/:id',
      detail: '/items/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  item_type: {
    displayName: 'Item Type',
    displayNamePlural: 'Item Types',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/item-types',
      add: '/item-types/add',
      edit: '/item-types/edit/:id',
      detail: '/item-types/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  karigar: {
    displayName: 'Karigar',
    displayNamePlural: 'Karigars',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/karigars',
      add: '/karigars/add',
      edit: '/karigars/edit/:id',
      detail: '/karigars/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  customer: {
    displayName: 'Customer',
    displayNamePlural: 'Customers',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/customers',
      add: '/customers/add',
      edit: '/customers/edit/:id',
      detail: '/customers/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  department_group: {
    displayName: 'Department Group',
    displayNamePlural: 'Department Groups',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/department-groups',
      add: '/department-groups/add',
      edit: '/department-groups/edit/:id',
      detail: '/department-groups/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  product_department_group: {
    displayName: 'Product Department Group',
    displayNamePlural: 'Product Department Groups',
    api: {
      listingMetadata: '/api/v1/entities/product_department_group/listing-metadata',
      formMetadata: '/api/v1/entities/product_department_group/form-metadata',
      list: '/api/v1/entities/product_department_group/list',
      create: '/api/v1/product/department-groups',
      get: '/api/v1/product/department-groups/{id}',
      update: '/api/v1/product/department-groups/{id}',
      delete: '/api/v1/product/department-groups/{id}',
    },
    routes: {
      list: '/product-department-groups',
      add: '/product-department-groups/add',
      edit: '/product-department-groups/edit/:id',
      detail: '/product-department-groups/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  product_department: {
    displayName: 'Product Department',
    displayNamePlural: 'Product Departments',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/product-departments',
      add: '/product-departments/add',
      edit: '/product-departments/edit/:id',
      detail: '/product-departments/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  department: {
    displayName: 'Department',
    displayNamePlural: 'Departments',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/departments',
      add: '/departments/add',
      edit: '/departments/edit/:id',
      detail: '/departments/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  role: {
    displayName: 'Role',
    displayNamePlural: 'Roles',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: '/api/v1/roles',
      get: '/api/v1/roles/{id}',
      update: '/api/v1/roles/{id}',
      delete: '/api/v1/roles/{id}',
    },
    routes: {
      list: '/roles',
      add: '/roles/add',
      edit: '/roles/edit/:id',
      detail: '/roles/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  workorder: {
    displayName: 'Work Order',
    displayNamePlural: 'Work Orders',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/work-orders',
      add: '/work-orders/add',
      edit: '/work-orders/edit/:id',
      detail: '/work-orders/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canExport: true,
    },
  },

  metal_ledger: {
    displayName: 'Metal Ledger',
    displayNamePlural: 'Metal Ledgers',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/metal-ledger',
      add: '/metal-ledger/add',
      edit: '/metal-ledger/edit/:id',
      detail: '/metal-ledger/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canExport: false,
    },
  },

  melting_pool_transaction: {
    displayName: 'Melting Pool Transaction',
    displayNamePlural: 'Melting Pool Transactions',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/melting-pool-transaction',
      add: '/melting-pool-transaction',
      edit: '/melting-pool-transaction/:id',
      detail: '/melting-pool-transaction/:id',
    },
    features: {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
    },
  },

  job_card: {
    displayName: 'Job Card',
    displayNamePlural: 'Job Cards',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      get: '/api/v1/manufacturing/job-cards/{entity_id}',
      update: '/api/v1/manufacturing/job-cards/{entity_id}',
      delete: '/api/v1/manufacturing/job-cards/{entity_id}',
    },
    routes: {
      list: '/job-card',
      edit: '/job-card/edit/:id',
      detail: '/job-card/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  job_card_transaction: {
    displayName: 'Job Card Transaction',
    displayNamePlural: 'Job Card Transactions',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      get: DEFAULT_API_PATHS.get,
    },
    routes: {
      list: '/job-card-transaction',
      detail: '/job-card-transaction/:id',
    },
    features: {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
    },
  },

  melting_lot: {
    displayName: 'Melting Lot',
    displayNamePlural: 'Melting Lots',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/melting-lot',
      add: '/melting-lot/add',
      edit: '/melting-lot/edit/:id',
      detail: '/melting-lot/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },

  parent_melting_lot: {
    displayName: 'Parent Melting Lot',
    displayNamePlural: 'Parent Melting Lots',
    api: {
      listingMetadata: DEFAULT_API_PATHS.listingMetadata,
      formMetadata: DEFAULT_API_PATHS.formMetadata,
      list: DEFAULT_API_PATHS.list,
      create: DEFAULT_API_PATHS.create,
      get: DEFAULT_API_PATHS.get,
      update: DEFAULT_API_PATHS.update,
      delete: DEFAULT_API_PATHS.delete,
    },
    routes: {
      list: '/parent-melting-lot',
      add: '/parent-melting-lot/add',
      edit: '/parent-melting-lot/edit/:id',
      detail: '/parent-melting-lot/:id',
    },
    features: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: false,
    },
  },
};

/**
 * Get entity configuration by name
 * Returns default configuration if entity not found
 */
export function getEntityConfig(entityName: string): EntityConfig {
  const config = ENTITY_CONFIG[entityName];

  if (!config) {
    console.warn(
      `[EntityConfig] No configuration found for entity "${entityName}", using defaults`
    );
    return {
      name: entityName,
      displayName: entityName.charAt(0).toUpperCase() + entityName.slice(1),
      displayNamePlural: entityName.charAt(0).toUpperCase() + entityName.slice(1) + 's',
      api: DEFAULT_API_PATHS,
      routes: {
        list: `/${entityName}s `,
        add: `/${entityName}s/add`,
        edit: `/${entityName}s/edit/:id`,
        detail: `/${entityName}s/:id`,
      },
      features: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: false,
      },
    };
  }

  return {
    name: entityName,
    ...config,
  };
}

/**
 * Get list of all configured entity names
 */
export function getAllEntityNames(): string[] {
  return Object.keys(ENTITY_CONFIG);
}

/** Entity names for standalone Roles & Permissions page (excludes user) */
const ROLES_TABLE_ENTITY_NAMES = ['product'] as const;

/** Entity names for user view/create/edit permission matrix (includes user) */
const USER_PERMISSIONS_ENTITY_NAMES = ['user', 'product'] as const;

export function getEntityNamesForRolesTable(): string[] {
  return [...ROLES_TABLE_ENTITY_NAMES];
}

export function getEntityNamesForUserPermissionsTable(): string[] {
  return [...USER_PERMISSIONS_ENTITY_NAMES];
}

/**
 * Build full API URL for an entity endpoint
 * Replaces {entity_name}, {id}, and {entity_id} placeholders
 */
export function buildEntityUrl(
  endpoint: string,
  entityName: string,
  params?: { id?: string | number }
): string {
  const baseUrl = getBaseUrl();
  let url = endpoint.replace(/\{entity_name\}/g, encodeURIComponent(entityName));

  const idStr = params?.id != null ? encodeURIComponent(String(params.id)) : '';
  if (idStr) {
    url = url.replace(/\{id\}/g, idStr).replace(/\{entity_id\}/g, idStr);
  }

  // Ensure path starts with /
  if (!url.startsWith('/')) {
    url = '/' + url;
  }

  return `${baseUrl}${url}`;
}

/**
 * Get all API URLs for an entity
 */
export function getEntityApiUrls(entityName: string) {
  const config = getEntityConfig(entityName);

  return {
    listingMetadata: buildEntityUrl(config.api.listingMetadata, entityName),
    formMetadata: buildEntityUrl(config.api.formMetadata, entityName),
    list: buildEntityUrl(config.api.list, entityName),
    ...(config.api.create != null && {
      create: buildEntityUrl(config.api.create, entityName),
    }),
    get: (id: string | number) => buildEntityUrl(config.api.get, entityName, { id }),
    ...(config.api.update != null && {
      update: (id: string | number) => buildEntityUrl(config.api.update!, entityName, { id }),
    }),
    ...(config.api.delete != null && {
      delete: (id: string | number) => buildEntityUrl(config.api.delete!, entityName, { id }),
    }),
  };
}

/**
 * Check if an entity has a specific feature enabled
 */
export function hasEntityFeature(
  entityName: string,
  feature: keyof NonNullable<EntityConfig['features']>
): boolean {
  const config = getEntityConfig(entityName);
  return config.features?.[feature] ?? true; // Default to true if not specified
}

/** Routes and API path for Roles & Permissions (no hardcoded URLs in components). */
export const roleConfig = {
  routes: {
      list: '/roles',
      add: '/roles/add',
      edit: '/roles/edit/:id',
      detail: '/roles/:id',
  },
  /** Backend roles API path. If you get 404 Not Found, change to match your API (e.g. '/api/roles' or '/roles'). */
  apiBasePath: '/api/v1/roles',
} as const;



