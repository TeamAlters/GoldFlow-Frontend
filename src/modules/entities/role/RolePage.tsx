import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { roleConfig } from '../../../config/entity.config';
import { listRoles, type RoleRow } from './role.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';

export default function RolePage() {
    const navigate = useNavigate();
    const isDarkMode = useUIStore((state) => state.isDarkMode);
    const [roles, setRoles] = useState<RoleRow[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRoles = useCallback(() => {
        setLoading(true);
        listRoles()
            .then(setRoles)
            .catch((err) => {
                const msg = err instanceof Error ? err.message : 'Failed to load roles';
                showErrorToastUnlessAuth(msg);
                setRoles([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleView = (id: string | number) => {
        navigate(roleConfig.routes.detail.replace(':id', String(id)));
    };
    const handleEdit = (id: string | number) => {
        navigate(roleConfig.routes.edit.replace(':id', String(id)));
    };

    const tableBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200';
    const tableBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const thBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
    const tdText = isDarkMode ? 'text-gray-200' : 'text-gray-900';
    const thText = isDarkMode ? 'text-gray-300' : 'text-gray-600';
    const divideClass = isDarkMode ? 'divide-gray-700' : 'divide-gray-200';

    return (
        <div className="w-full">
            <Breadcrumbs
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Roles & Permissions' },
                ]}
                className="mb-4"
            />
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1
                        className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                        Roles & Permissions
                    </h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Manage roles and table-level permissions per entity.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(roleConfig.routes.add)}
                    className={`shrink-0 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                >
                    Add role
                </button>
            </div>
            <div
                className={`overflow-hidden rounded-xl border ${tableBorder} ${tableBg} shadow-sm`}
            >
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
                    </div>
                ) : (
                    <table className="min-w-full table-fixed">
                        <thead>
                            <tr className={divideClass}>
                                <th
                                    scope="col"
                                    className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${thBg} ${thText} rounded-tl-xl w-[40%]`}
                                >
                                    Role Name
                                </th>
                                <th
                                    scope="col"
                                    className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${thBg} ${thText} w-[25%]`}
                                >
                                    Is System Role
                                </th>
                                <th
                                    scope="col"
                                    className={`px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider ${thBg} ${thText} rounded-tr-xl w-[35%]`}
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${divideClass}`}>
                            {roles.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className={`px-5 py-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                    >
                                        No roles found. Add a role to get started.
                                    </td>
                                </tr>
                            ) : (
                                roles.map((row) => (
                                    <tr
                                        key={String(row.id)}
                                        className={isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}
                                    >
                                        <td className={`px-5 py-3.5 text-sm font-medium ${tdText}`}>
                                            {row.role_name ?? '—'}
                                        </td>
                                        <td className={`px-5 py-3.5 text-sm ${tdText}`}>
                                            {row.is_system_role ? 'Yes' : 'No'}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleView(row.id)}
                                                className={`font-medium mr-3 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                            >
                                                View
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(row.id)}
                                                className={`font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
