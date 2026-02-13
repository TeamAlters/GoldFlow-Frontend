import type { EntityConfig } from '../../config/entity.config';

/** "View {displayName}" for view page heading and fallback breadcrumb */
export function getViewPageTitle(config: EntityConfig): string {
  return `View ${config.displayName}`;
}

/** "Edit {displayName}" for edit page heading and fallback breadcrumb */
export function getEditPageTitle(config: EntityConfig): string {
  return `Edit ${config.displayName}`;
}

/** "Add {displayName}" for create page heading and breadcrumb */
export function getAddPageTitle(config: EntityConfig): string {
  return `Add ${config.displayName}`;
}

/** Breadcrumb label for view: use displayValue when present, else "View {displayName}" */
export function getViewBreadcrumbLabel(
  config: EntityConfig,
  displayValue: string | null | undefined
): string {
  const value = displayValue != null && String(displayValue).trim() !== '' ? String(displayValue).trim() : undefined;
  return value ?? getViewPageTitle(config);
}

/** Breadcrumb label for edit: use displayValue when present, else "Edit {displayName}" */
export function getEditBreadcrumbLabel(
  config: EntityConfig,
  displayValue: string | null | undefined
): string {
  const value = displayValue != null && String(displayValue).trim() !== '' ? String(displayValue).trim() : undefined;
  return value ?? getEditPageTitle(config);
}

/** "Read-only {displayName} information." for view page description */
export function getViewPageDescription(config: EntityConfig): string {
  return `Read-only ${config.displayName.toLowerCase()} information.`;
}

/** "Update {displayName} information." for edit page description */
export function getEditPageDescription(config: EntityConfig): string {
  return `Update ${config.displayName.toLowerCase()} information.`;
}
