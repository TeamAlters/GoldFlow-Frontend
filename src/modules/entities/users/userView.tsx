import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig, getEntityNamesForRolesTable } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticUserForm, { type StaticUserFormData } from './userForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import {
    RolesPermissionsTable,
    buildInitialMatrix,
    type PermissionsMatrix,
} from '../../admin/RolesPage';
import {
    type CapabilitiesState,
    toInitialUserData,
    capabilitiesFromEntity,
} from './userCreate';
import {
    getViewPageHeading,
    getViewBreadcrumbLabel,
    getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';

const ENTITY_NAME = 'user';

export default function UserViewPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const entityConfig = getEntityConfig(ENTITY_NAME);

    const [initialData, setInitialData] = useState<Partial<StaticUserFormData> | undefined>(undefined);
    const [dataLoading, setDataLoading] = useState(true);

    const entityNames = useMemo(() => getEntityNamesForRolesTable(), []);
    const [permissionsMatrix, setPermissionsMatrix] = useState<PermissionsMatrix>(() =>
        buildInitialMatrix(entityNames)
    );
    const [capabilities, setCapabilities] = useState<CapabilitiesState>({
        canCreateDepartment: false,
        canViewActivity: false,
    });

    useEffect(() => {
        if (!id) return;
        setDataLoading(true);
        getEntity(ENTITY_NAME, id)
            .then((res) => {
                if (res.data && typeof res.data === 'object') {
                    const entity = res.data as Record<string, unknown>;
                    setInitialData(toInitialUserData(entity));
                    setCapabilities(capabilitiesFromEntity(entity));
                    // If API returns role_permissions in same shape, we could set it here
                    const rolePerms = entity.role_permissions;
                    if (
                        rolePerms &&
                        typeof rolePerms === 'object' &&
                        !Array.isArray(rolePerms)
                    ) {
                        const next: PermissionsMatrix = {};
                        for (const key of entityNames) {
                            const row = (rolePerms as Record<string, unknown>)[key];
                            if (
                                row &&
                                typeof row === 'object' &&
                                'create' in row &&
                                'read' in row &&
                                'update' in row &&
                                'delete' in row
                            ) {
                                next[key] = {
                                    create: (row as Record<string, unknown>).create === true,
                                    read: (row as Record<string, unknown>).read === true,
                                    update: (row as Record<string, unknown>).update === true,
                                    delete: (row as Record<string, unknown>).delete === true,
                                };
                            }
                        }
                        if (Object.keys(next).length > 0) {
                            setPermissionsMatrix((prev) => ({ ...prev, ...next }));
                        }
                    }
                }
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : 'Failed to load user';
                showErrorToastUnlessAuth(msg);
            })
            .finally(() => setDataLoading(false));
    }, [id, entityNames]);

    const handleBack = useCallback(() => {
        navigate(entityConfig.routes.list);
    }, [navigate, entityConfig.routes.list]);

    const isDarkMode = useUIStore((state) => state.isDarkMode);
    const editUrl = entityConfig.routes.edit.replace(':id', id ?? '');
    const checkboxClass =
        'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-700 dark:checked:bg-blue-600 pointer-events-none';

    if (!id) {
        return <Navigate to={entityConfig.routes.list} replace />;
    }

    const displayValue = (initialData?.username ?? initialData?.email) as string | undefined;
    const viewPageHeading = getViewPageHeading(entityConfig, displayValue);
    const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, displayValue);

    if (dataLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loading user...
                    </p>
                </div>
            </div>
        );
    }

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
                    className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                    {viewPageHeading}
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {getViewPageDescription(entityConfig)}
                </p>
            </div>
            <div
                className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
            >
                <StaticUserForm
                    initialData={initialData}
                    isEdit={true}
                    readOnly={true}
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
                        Table-level permissions: Create, Read, Update, and Delete per entity.
                    </p>
                    <div
                        className={`overflow-hidden rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
                    >
                        <RolesPermissionsTable
                            matrix={permissionsMatrix}
                            onToggle={() => { }}
                            readOnly={true}
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
                        <label className="flex items-center gap-3 select-none">
                            <input
                                type="checkbox"
                                checked={capabilities.canCreateDepartment}
                                readOnly
                                className={checkboxClass}
                                aria-label="Can create department"
                            />
                            <span
                                className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
                            >
                                Can create department
                            </span>
                        </label>
                        <label className="flex items-center gap-3 select-none">
                            <input
                                type="checkbox"
                                checked={capabilities.canViewActivity}
                                readOnly
                                className={checkboxClass}
                                aria-label="Can view activity"
                            />
                            <span
                                className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
                            >
                                Can view activity
                            </span>
                        </label>
                    </div>
                </section>

                <div className="flex items-center justify-end gap-3 pt-6 mt-6">
                    <button
                        type="button"
                        onClick={handleBack}
                        className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                    >
                        Back
                    </button>
                    <Link
                        to={editUrl}
                        className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                        Edit {entityConfig.displayName}
                    </Link>
                </div>
            </div>
        </div>
    );
}
