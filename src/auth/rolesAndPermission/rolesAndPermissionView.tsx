import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { useUIStore } from '../../stores/ui.store';
import Breadcrumbs from '../../layout/Breadcrumbs';
import { RolesPermissionsTable, type PermissionsMatrix } from './rolesAndPermissionForm';
import { roleConfig } from '../../config/entity.config';
import { getRole, permissionsFromApi } from './role.api';
import { showErrorToastUnlessAuth } from '../../shared/utils/errorHandling';
import { formatDateTime } from '../../shared/utils/dateUtils';

export default function RolesAndPermissionViewPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isDarkMode = useUIStore((state) => state.isDarkMode);
    const [role, setRole] = useState<Awaited<ReturnType<typeof getRole>>>(null);
    const [loading, setLoading] = useState(true);

    const { entityNames, permissionsMatrix } = useMemo(() => {
        const perms = role?.permissions;
        if (perms && typeof perms === 'object' && !Array.isArray(perms)) {
            const keys = Object.keys(perms).sort();
            return { entityNames: keys, permissionsMatrix: permissionsFromApi(perms) };
        }
        return { entityNames: [] as string[], permissionsMatrix: {} as PermissionsMatrix };
    }, [role]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getRole(id)
            .then((data) => setRole(data ?? null))
            .catch((err) => {
                const msg = err instanceof Error ? err.message : 'Failed to load role';
                showErrorToastUnlessAuth(msg);
                setRole(null);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleBack = useCallback(() => {
        navigate(roleConfig.routes.list);
    }, [navigate]);

    const editUrl = id ? roleConfig.routes.edit.replace(':id', id) : roleConfig.routes.list;

    if (!id) {
        return <Navigate to={roleConfig.routes.list} replace />;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loading role...
                    </p>
                </div>
            </div>
        );
    }

    if (!role) {
        return (
            <div className="w-full">
                <Breadcrumbs
                    items={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Roles & Permissions', href: roleConfig.routes.list },
                        { label: 'Role' },
                    ]}
                    className="mb-4"
                />
                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        Role not found.
                    </p>
                    <button
                        type="button"
                        onClick={handleBack}
                        className={`mt-4 px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                    >
                        Back to list
                    </button>
                </div>
            </div>
        );
    }

    const cardClass = isDarkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200 shadow-sm';

    return (
        <div className="w-full">
            <Breadcrumbs
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Roles & Permissions', href: roleConfig.routes.list },
                    { label: role.name ?? 'Role' },
                ]}
                className="mb-4"
            />
            <div className="mb-6">
                <h1
                    className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                    {role.name ?? 'Role'}
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    View role details and entity permissions.
                </p>
            </div>
            <div className={`p-6 rounded-xl border ${cardClass}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Role Name
                        </label>
                        <div
                            className={`min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                        >
                            {role.name ?? '—'}
                        </div>
                    </div>
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Is System Role
                        </label>
                        <div
                            className={`min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                        >
                            {role.is_system_role ? 'Yes' : 'No'}
                        </div>
                    </div>
                    {role.created_at != null && (
                        <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Created At
                            </label>
                            <div
                                className={`min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                            >
                                {formatDateTime(role.created_at)}
                            </div>
                        </div>
                    )}
                    {role.updated_at != null && (
                        <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Updated At
                            </label>
                            <div
                                className={`min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                            >
                                {formatDateTime(role.updated_at)}
                            </div>
                        </div>
                    )}
                    {(role.description != null && role.description !== '') && (
                        <div className="md:col-span-2">
                            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Description
                            </label>
                            <div
                                className={`min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                            >
                                {role.description}
                            </div>
                        </div>
                    )}
                </div>

                <section className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Entity Permissions
                    </h2>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Table-level permissions per entity.
                    </p>
                    <div
                        className={`overflow-hidden rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
                    >
                        {entityNames.length > 0 ? (
                            <RolesPermissionsTable
                                matrix={permissionsMatrix}
                                onToggle={() => { }}
                                readOnly
                                useEntityDisplayNames
                                entityNames={entityNames}
                            />
                        ) : (
                            <p className={`px-6 py-8 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                No permissions configured.
                            </p>
                        )}
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
                        Edit Role
                    </Link>
                </div>
            </div>
        </div>
    );
}
