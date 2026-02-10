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

    /** POST create endpoint */
    create: string;

    /** GET single item endpoint (use {id} or {entity_id} placeholder) */
    get: string;

    /** PUT/PATCH update endpoint (use {id} or {entity_id} placeholder) */
    update: string;

    /** DELETE endpoint (use {id} or {entity_id} placeholder) */
    delete: string;
  };

  /** Route paths in the app */
  routes: {
    /** List page route */
    list: string;

    /** Add new item route */
    add: string;

    /** Edit item route (use :id for route param) */
    edit: string;

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

  thikness: {
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

/** Entity names to show in Roles/Permissions table (excludes work order) */
const ROLES_TABLE_ENTITY_NAMES = ['user', 'product'] as const;

export function getEntityNamesForRolesTable(): string[] {
  return [...ROLES_TABLE_ENTITY_NAMES];
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
    create: buildEntityUrl(config.api.create, entityName),
    get: (id: string | number) => buildEntityUrl(config.api.get, entityName, { id }),
    update: (id: string | number) => buildEntityUrl(config.api.update, entityName, { id }),
    delete: (id: string | number) => buildEntityUrl(config.api.delete, entityName, { id }),
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
