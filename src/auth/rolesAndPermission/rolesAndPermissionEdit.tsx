import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useUIStore } from '../../stores/ui.store';
import Breadcrumbs from '../../layout/Breadcrumbs';
import {
    RolesPermissionsTable,
    defaultPermissions,
    type PermissionsMatrix,
    type Permission,
} from './rolesAndPermissionForm';
import { roleConfig } from '../../config/entity.config';
import { getRole, updateRole, permissionsFromApi, permissionsToApi } from './role.api';
import { toast } from '../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../shared/utils/errorHandling';
import {
    MAX_TEXT_FIELD_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    maxLengthError,
} from '../../shared/utils/formValidation';

export default function RolesAndPermissionEditPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isDarkMode = useUIStore((state) => state.isDarkMode);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSystemRole, setIsSystemRole] = useState(false);
    const [permissionsMatrix, setPermissionsMatrix] = useState<PermissionsMatrix>({});
    const [entityNames, setEntityNames] = useState<string[]>([]);
    const [nameError, setNameError] = useState('');
    const [descriptionError, setDescriptionError] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [roleTitle, setRoleTitle] = useState('');

    useEffect(() => {
        if (!id) return;
        setDataLoading(true);
        getRole(id)
            .then((data) => {
                if (data) {
                    setName(data.name ?? '');
                    setDescription(data.description ?? '');
                    setIsSystemRole(Boolean(data.is_system_role));
                    if (data.permissions && typeof data.permissions === 'object') {
                        const keys = Object.keys(data.permissions).sort();
                        setEntityNames(keys);
                        setPermissionsMatrix(permissionsFromApi(data.permissions));
                    } else {
                        setEntityNames([]);
                        setPermissionsMatrix({});
                    }
                    setRoleTitle(data.name ?? 'Role');
                }
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : 'Failed to load role';
                showErrorToastUnlessAuth(msg);
            })
            .finally(() => setDataLoading(false));
    }, [id]);

    const handlePermissionToggle = useCallback((tableKey: string, permission: Permission) => {
        setPermissionsMatrix((prev) => {
            const row = prev[tableKey] ?? defaultPermissions();
            return { ...prev, [tableKey]: { ...row, [permission]: !row[permission] } };
        });
    }, []);

    const handleSelectAll = useCallback((perm: Permission, value: boolean) => {
        setPermissionsMatrix((prev) => {
            const updated = { ...prev };
            const keys = Object.keys(prev);
            keys.forEach((key) => {
                updated[key] = { ...(prev[key] ?? defaultPermissions()), [perm]: value };
            });
            return updated;
        });
    }, []);

    const validate = useCallback((): boolean => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setNameError('Name is required');
            return false;
        }
        if (trimmedName.length > MAX_TEXT_FIELD_LENGTH) {
            setNameError(maxLengthError('Name'));
            return false;
        }
        if (description.length > MAX_DESCRIPTION_LENGTH) {
            setDescriptionError(maxLengthError('Description', MAX_DESCRIPTION_LENGTH));
            return false;
        }
        setNameError('');
        setDescriptionError('');
        return true;
    }, [name, description]);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!id || !validate()) return;
            setSubmitLoading(true);
            const payload = {
                name: name.trim(),
                description: description.trim() || undefined,
                is_system_role: isSystemRole,
                permissions: permissionsToApi(permissionsMatrix),
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
        [id, name, description, isSystemRole, permissionsMatrix, validate, navigate]
    );

    const handleCancel = useCallback(() => {
        navigate(roleConfig.routes.list);
    }, [navigate]);

    const inputClass = isDarkMode
        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500';
    const errorClass = isDarkMode ? 'text-red-400' : 'text-red-600';
    const cardClass = isDarkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200 shadow-sm';

    if (!id) {
        return <Navigate to={roleConfig.routes.list} replace />;
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
                <div className={`p-6 rounded-xl border shadow-sm ${cardClass}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="role_name"
                                className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                                Role Name
                            </label>
                            <input
                                id="role_name"
                                type="text"
                                placeholder="Name"
                                maxLength={MAX_TEXT_FIELD_LENGTH}
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (nameError) setNameError('');
                                }}
                                className={`w-full p-2.5 h-10 rounded-lg border ${inputClass} ${nameError ? 'border-red-500 focus:ring-red-500' : ''}`}
                            />
                            {nameError && (
                                <p className={`text-sm ${errorClass}`}>{nameError}</p>
                            )}
                        </div>
                        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                            <label
                                htmlFor="role_description_edit"
                                className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                                Description
                            </label>
                            <input
                                id="role_description_edit"
                                type="text"
                                placeholder="Description"
                                maxLength={MAX_DESCRIPTION_LENGTH}
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    if (descriptionError) setDescriptionError('');
                                }}
                                className={`w-full p-2.5 h-10 rounded-lg border ${inputClass} ${descriptionError ? 'border-red-500 focus:ring-red-500' : ''}`}
                            />
                            {descriptionError && (
                                <p className={`text-sm ${errorClass}`}>{descriptionError}</p>
                            )}
                        </div>
                        <div className="flex items-end">
                            <label
                                htmlFor="is_system_role_edit"
                                className={`inline-flex items-center gap-2 cursor-pointer select-none py-2.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                                <input
                                    type="checkbox"
                                    id="is_system_role_edit"
                                    checked={isSystemRole}
                                    onChange={(e) => setIsSystemRole(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-700 dark:checked:bg-blue-600"
                                />
                                <span className="text-sm font-medium">Is System Role</span>
                            </label>
                        </div>
                    </div>
                    <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Entity Permissions
                    </h2>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Toggle permissions per entity.
                    </p>
                    <div
                        className={`overflow-hidden rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
                    >
                        {entityNames.length > 0 ? (
                            <RolesPermissionsTable
                                matrix={permissionsMatrix}
                                onToggle={handlePermissionToggle}
                                onSelectAll={handleSelectAll}
                                useEntityDisplayNames
                                entityNames={entityNames}
                            />
                        ) : (
                            <p className={`px-6 py-8 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                No permissions. Load role to see entities.
                            </p>
                        )}
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
            </form>
        </div>
    );
}
