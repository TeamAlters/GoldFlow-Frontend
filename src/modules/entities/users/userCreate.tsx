import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig, getEntityNamesForRolesTable } from '../../../config/entity.config';
import { createEntity } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { isAuthError } from '../../../shared/utils/errorHandling';
import { useAuthStore } from '../../../auth/auth.store';
import { useUIStore } from '../../../stores/ui.store';
import StaticUserForm, {
    type StaticUserFormData,
    type StaticUserFormRef,
} from './userForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import {
    RolesPermissionsTable,
    buildInitialMatrix,
    type PermissionsMatrix,
    type Permission,
} from '../../admin/RolesPage';

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

export default function UserCreatePage() {
    const navigate = useNavigate();
    const entityConfig = getEntityConfig(ENTITY_NAME);
    const logout = useAuthStore((state) => state.logout);

    const [submitLoading, setSubmitLoading] = useState(false);

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
                if (isAuthError(msg)) handleAuthError();
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
            <div className="mb-6">
                <h1
                    className={`text-2xl font-bold tracking-tight sm:text-3xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                    Create a new user account
                </h1>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Enter user details and assign permissions below.
                </p>
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
