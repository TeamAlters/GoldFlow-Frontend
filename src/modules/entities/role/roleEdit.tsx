import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityNamesForRolesTable } from '../../../config/entity.config';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import {
    RolesPermissionsTable,
    buildInitialMatrix,
    defaultPermissions,
    type PermissionsMatrix,
    type Permission,
} from '../../../auth/rolesAndPermission/rolesAndPermissionForm';
import { roleConfig } from '../../../config/entity.config';
import { getRole, updateRole, type RoleDetail } from './role.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { MAX_TEXT_FIELD_LENGTH, maxLengthError } from '../../../shared/utils/formValidation';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

export function permissionsFromRole(role: RoleDetail | null, entityNames: string[]): PermissionsMatrix {
    const base = buildInitialMatrix(entityNames);
    if (!role?.permissions || typeof role.permissions !== 'object' || Array.isArray(role.permissions)) {
        return base;
    }
    const next: PermissionsMatrix = { ...base };
    const perms = role.permissions as Record<string, unknown>;
    for (const key of entityNames) {
        const row = perms[key];
        if (row && typeof row === 'object' && 'create' in row && 'read' in row && 'update' in row && 'delete' in row) {
            const r = row as Record<string, unknown>;
            next[key] = {
                create: Boolean(r.create),
                read: Boolean(r.read),
                update: Boolean(r.update),
                delete: Boolean(r.delete),
                export: Boolean(r.export),
            };
        }
    }
    return next;
}

export default function RoleEditPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isDarkMode = useUIStore((state) => state.isDarkMode);
    const sectionClass = getSectionClass(isDarkMode);
    const entityNames = useMemo(() => getEntityNamesForRolesTable(), []);
    const [roleName, setRoleName] = useState('');
    const [isSystemRole, setIsSystemRole] = useState(false);
    const [permissionsMatrix, setPermissionsMatrix] = useState<PermissionsMatrix>(() =>
        buildInitialMatrix(entityNames)
    );
    const [roleNameError, setRoleNameError] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [roleTitle, setRoleTitle] = useState('');

    useEffect(() => {
        if (!id) return;
        setDataLoading(true);
        getRole(id)
            .then((data) => {
                if (data) {
                    setRoleName(data.role_name ?? '');
                    setIsSystemRole(Boolean(data.is_system_role));
                    setPermissionsMatrix(permissionsFromRole(data, entityNames));
                    setRoleTitle(data.role_name ?? 'Role');
                }
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : 'Failed to load role';
                showErrorToastUnlessAuth(msg);
            })
            .finally(() => setDataLoading(false));
    }, [id, entityNames]);

    const handlePermissionToggle = useCallback((tableKey: string, permission: Permission) => {
        setPermissionsMatrix((prev) => {
            const row = prev[tableKey] ?? defaultPermissions();
            return { ...prev, [tableKey]: { ...row, [permission]: !row[permission] } };
        });
    }, []);

    const validate = useCallback((): boolean => {
        const trimmed = roleName.trim();
        if (!trimmed) {
            setRoleNameError('Role name is required');
            return false;
        }
        if (trimmed.length > MAX_TEXT_FIELD_LENGTH) {
            setRoleNameError(maxLengthError('Role name'));
            return false;
        }
        setRoleNameError('');
        return true;
    }, [roleName]);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!id || !validate()) return;
            setSubmitLoading(true);
            const payload = {
                role_name: roleName.trim(),
                is_system_role: isSystemRole,
                permissions: permissionsMatrix,
            };
            updateRole(id, payload)
                .then(() => {
                    toast.success('Role updated successfully.');
                    navigate(roleConfig.routes.detail.replace(':id', id));
                })
                .catch((err) => {
                    const msg = err instanceof Error ? err.message : 'Failed to update role';
                    showErrorToastUnlessAuth(msg);
                })
                .finally(() => setSubmitLoading(false));
        },
        [id, roleName, isSystemRole, permissionsMatrix, validate, navigate]
    );

    const handleCancel = useCallback(() => {
        if (id) navigate(roleConfig.routes.detail.replace(':id', id));
        else navigate(roleConfig.routes.list);
    }, [id, navigate]);

    const inputClass = isDarkMode
        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500';
    const errorClass = isDarkMode ? 'text-red-400' : 'text-red-600';
    const cardClass = isDarkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200 shadow-sm';

    if (!id) {
        return (
            <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_INVALID_URL }} replace />
        );
    }

    if (dataLoading) {
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

    return (
        <div className="w-full">
            <Breadcrumbs
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Roles & Permissions', href: roleConfig.routes.list },
                    { label: roleTitle, href: roleConfig.routes.detail.replace(':id', id) },
                    { label: 'Edit' },
                ]}
                className="mb-4"
            />
            <div className="mb-6">
                <h1
                    className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                    Edit role
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Update role name and entity permissions.
                </p>
            </div>
            <form onSubmit={handleSubmit}>
                <div className={`p-6 rounded-xl border ${cardClass}`}>
                    <div className={sectionClass}>
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="w-full max-w-xs">
                            <label
                                htmlFor="role_name"
                                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                                Role Name
                            </label>
                            <input
                                id="role_name"
                                type="text"
                                placeholder="Role Name"
                                maxLength={MAX_TEXT_FIELD_LENGTH}
                                value={roleName}
                                onChange={(e) => {
                                    setRoleName(e.target.value);
                                    if (roleNameError) setRoleNameError('');
                                }}
                                className={`w-full p-2.5 h-10 rounded-md border ${inputClass} ${roleNameError ? 'border-red-500' : ''}`}
                            />
                            {roleNameError && (
                                <p className={`mt-1 text-sm ${errorClass}`}>{roleNameError}</p>
                            )}
                        </div>
                        <label
                            htmlFor="is_system_role_edit"
                            className={`inline-flex items-center gap-2 cursor-pointer select-none mt-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                            <input
                                type="checkbox"
                                id="is_system_role_edit"
                                checked={isSystemRole}
                                onChange={(e) => setIsSystemRole(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-700 dark:checked:bg-blue-600"
                            />
                            <span>Is System Role</span>
                        </label>
                    </div>
                    <h2 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        Entities
                    </h2>
                    <div
                        className={`overflow-hidden rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                    >
                        <RolesPermissionsTable
                            matrix={permissionsMatrix}
                            onToggle={handlePermissionToggle}
                            useEntityDisplayNames
                            entityNames={entityNames}
                        />
                    </div>
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
                            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50' : 'bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50'}`}
                        >
                            {submitLoading ? 'Saving...' : 'Update role'}
                        </button>
                    </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
