import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getEntityConfig, getEntityNamesForRolesTable } from '../../config/entity.config';
import { createEntity, getEntityList } from './admin.api';
import { toast } from '../../stores/toast.store';
import { useAuthStore } from '../../auth/auth.store';
import { useUIStore } from '../../stores/ui.store';
import StaticUserForm, {
  type StaticUserFormData,
  type StaticUserFormRef,
} from './StaticUserForm';
import Breadcrumbs from '../../layout/Breadcrumbs';
import {
  RolesPermissionsTable,
  buildInitialMatrix,
  type PermissionsMatrix,
  type Permission,
} from './RolesPage';

const ENTITY_NAME = 'user';

export type CapabilitiesState = {
  canCreateDepartment: boolean;
  canViewActivity: boolean;
};

export function toInitialUserData(entity: Record<string, unknown>): Partial<StaticUserFormData> {
  return {
    username: entity.username != null ? String(entity.username) : '',
    email: entity.email != null ? String(entity.email) : '',
    mobile_number: entity.mobile_number != null ? String(entity.mobile_number) : '',
    is_superuser: entity.is_superuser === true ? 'true' : 'false',
    status: entity.status != null ? String(entity.status) : 'active',
  };
}

export function toUserPayload(
  data: StaticUserFormData,
  isEdit: boolean,
  capabilities: CapabilitiesState
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    username: data.username.trim(),
    email: data.email.trim(),
    mobile_number: data.mobile_number.trim() || '',
    is_superuser: data.is_superuser === 'true',
    status: data.status || 'active',
    can_create_department: capabilities.canCreateDepartment,
    can_view_activity: capabilities.canViewActivity,
  };
  if (!isEdit && data.password) {
    payload.password = data.password;
  }
  return payload;
}

/** Parse capabilities from API entity response if present */
export function capabilitiesFromEntity(entity: Record<string, unknown>): CapabilitiesState {
  return {
    canCreateDepartment: entity.can_create_department === true,
    canViewActivity: entity.can_view_activity === true,
  };
}

export default function AddUserPage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const logout = useAuthStore((state) => state.logout);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [usersList, setUsersList] = useState<Array<{ id: string; username?: string; email?: string }>>([]);
  const [usersListLoading, setUsersListLoading] = useState(false);
  const [editDropdownOpen, setEditDropdownOpen] = useState(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUsersListLoading(true);
    getEntityList(ENTITY_NAME, { page: 1, page_size: 100 })
      .then((res) => {
        const data = res.data as { items?: unknown[]; results?: unknown[] } | undefined;
        const items = (data?.items ?? data?.results ?? []) as Array<Record<string, unknown>>;
        setUsersList(
          items.map((row) => ({
            id: String(row.id ?? ''),
            username: row.username != null ? String(row.username) : undefined,
            email: row.email != null ? String(row.email) : undefined,
          }))
        );
      })
      .catch(() => setUsersList([]))
      .finally(() => setUsersListLoading(false));
  }, []);

  useEffect(() => {
    if (!editDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target as Node)) {
        setEditDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editDropdownOpen]);

  const handleEditUser = useCallback(
    (id: string) => {
      setEditDropdownOpen(false);
      navigate(entityConfig.routes.edit.replace(':id', id));
    },
    [navigate, entityConfig.routes.edit]
  );

  const entityNames = useMemo(() => getEntityNamesForRolesTable(), []);
  const [permissionsMatrix, setPermissionsMatrix] = useState<PermissionsMatrix>(() =>
    buildInitialMatrix(entityNames)
  );
  const [capabilities, setCapabilities] = useState<CapabilitiesState>({
    canCreateDepartment: false,
    canViewActivity: false,
  });
  const userFormRef = useRef<StaticUserFormRef>(null);

  const handlePermissionToggle = useCallback((tableKey: string, permission: Permission) => {
    setPermissionsMatrix((prev) => {
      const next = { ...prev };
      const row = next[tableKey] ?? { create: false, read: false, update: false, delete: false };
      next[tableKey] = { ...row, [permission]: !row[permission] };
      return next;
    });
  }, []);

  const handleAuthError = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);


  const handleSubmit = useCallback(
    async (formData: StaticUserFormData) => {
      const payload = toUserPayload(formData, false, capabilities);
      setSubmitLoading(true);
      try {
        await createEntity(ENTITY_NAME, payload);
        toast.success(`${entityConfig.displayName} created successfully.`);
        navigate(entityConfig.routes.list);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Request failed';
        toast.error(msg);
        if (/401|unauthorized/i.test(msg)) handleAuthError();
      } finally {
        setSubmitLoading(false);
      }
    },
    [navigate, entityConfig, handleAuthError, capabilities]
  );

  const handleCancel = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (userFormRef.current?.validate()) {
        const userData = userFormRef.current.getData();
        handleSubmit(userData);
      }
    },
    [handleSubmit]
  );

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const checkboxClass =
    'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-700 dark:checked:bg-blue-600';

  const breadcrumbLabel = `Add ${entityConfig.displayName}`;

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
          { label: breadcrumbLabel },
        ]}
        className="mb-4"
      />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1
            className={`text-2xl font-bold tracking-tight sm:text-3xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Create a new user account
          </h1>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Enter user details and assign permissions below.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center justify-end gap-2 sm:justify-start">
          <div className="relative" ref={editDropdownRef}>
            <button
              type="button"
              onClick={() => setEditDropdownOpen((o) => !o)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
              aria-expanded={editDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Edit user"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit user
              <svg className={`h-4 w-4 shrink-0 transition-transform ${editDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {editDropdownOpen && (
              <div
                className={`absolute right-0 top-full z-10 mt-1 min-w-[12rem] overflow-hidden rounded-lg border shadow-lg ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`}
                role="listbox"
              >
                {usersListLoading ? (
                  <div className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading users...
                  </div>
                ) : usersList.length === 0 ? (
                  <div className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No users found
                  </div>
                ) : (
                  <ul className="max-h-60 overflow-auto py-1">
                    {usersList.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => handleEditUser(u.id)}
                          className={`flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}
                          role="option"
                        >
                          <span className="font-medium">{u.username || u.email || 'User'}</span>
                          {u.email && u.username !== u.email && (
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{u.email}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <Link
            to={entityConfig.routes.list}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${isDarkMode ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete user
          </Link>
        </div>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <StaticUserForm
          ref={userFormRef}
          initialData={undefined}
          isEdit={false}
          wrapInForm={false}
          showActions={false}
        />

        <section className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h2
            className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Roles and Permissions
          </h2>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Assign table-level permissions: Create, Read, Update, and Delete per entity.
          </p>
          <div
            className={`overflow-hidden rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <RolesPermissionsTable
              matrix={permissionsMatrix}
              onToggle={handlePermissionToggle}
            />
          </div>
        </section>

        <section className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h2
            className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Capabilities
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={capabilities.canCreateDepartment}
                onChange={(e) =>
                  setCapabilities((prev) => ({
                    ...prev,
                    canCreateDepartment: e.target.checked,
                  }))
                }
                className={checkboxClass}
                aria-label="Can create department"
              />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Can create department
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={capabilities.canViewActivity}
                onChange={(e) =>
                  setCapabilities((prev) => ({
                    ...prev,
                    canViewActivity: e.target.checked,
                  }))
                }
                className={checkboxClass}
                aria-label="Can view activity"
              />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Can view activity
              </span>
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 pt-6 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLoading}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} disabled:opacity-60`}
          >
            {submitLoading ? 'Saving...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}
