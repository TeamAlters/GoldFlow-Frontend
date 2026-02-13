import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig, getEntityNamesForRolesTable } from '../../../config/entity.config';
import { getEntity, updateEntity } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
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
import {
    type CapabilitiesState,
    toInitialUserData,
    toUserPayload,
    capabilitiesFromEntity,
} from './userCreate';
import {
    getEditPageTitle,
    getEditBreadcrumbLabel,
    getEditPageDescription,
} from '../../../shared/utils/entityPageLabels';

const ENTITY_NAME = 'user';

export default function EditUserPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const entityConfig = getEntityConfig(ENTITY_NAME);

    const [initialData, setInitialData] = useState<Partial<StaticUserFormData> | undefined>(
        undefined
    );
    const [dataLoading, setDataLoading] = useState(true);
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

    useEffect(() => {
        if (!id) return;
        setDataLoading(true);
        getEntity(ENTITY_NAME, id)
            .then((res) => {
                if (res.data && typeof res.data === 'object') {
                    const entity = res.data as Record<string, unknown>;
                    setInitialData(toInitialUserData(entity));
                    setCapabilities(capabilitiesFromEntity(entity));
                }
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : 'Failed to load user';
                showErrorToastUnlessAuth(msg);
            })
            .finally(() => setDataLoading(false));
    }, [id]);

    const handleSubmit = useCallback(
        async (formData: StaticUserFormData) => {
            if (!id) return;
            const payload = toUserPayload(formData, true, capabilities);
            setSubmitLoading(true);
            try {
                await updateEntity(ENTITY_NAME, id, payload);
                toast.success(`${entityConfig.displayName} updated successfully.`);
                navigate(entityConfig.routes.list);
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Request failed';
                showErrorToastUnlessAuth(msg);
            } finally {
                setSubmitLoading(false);
            }
        },
        [id, navigate, entityConfig, capabilities]
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

    if (!id) {
        return <Navigate to={entityConfig.routes.list} replace />;
    }

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

    const breadcrumbLabel = getEditBreadcrumbLabel(entityConfig, initialData?.username);

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
                    {getEditPageTitle(entityConfig)}
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {getEditPageDescription(entityConfig)}
                </p>
            </div>
            <form
                onSubmit={handleFormSubmit}
                className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
            >
                <StaticUserForm
                    ref={userFormRef}
                    initialData={initialData}
                    isEdit={true}
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
                                    setCapabilities((prev: CapabilitiesState) => ({
                                        ...prev,
                                        canCreateDepartment: e.target.checked,
                                    }))
                                }
                                className={checkboxClass}
                                aria-label="Can create department"
                            />
                            <span
                                className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
                            >
                                Can create department
                            </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={capabilities.canViewActivity}
                                onChange={(e) =>
                                    setCapabilities((prev: CapabilitiesState) => ({
                                        ...prev,
                                        canViewActivity: e.target.checked,
                                    }))
                                }
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
                        onClick={handleCancel}
                        className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitLoading}
                        className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } disabled:opacity-60`}
                    >
                        {submitLoading ? 'Saving...' : `Update ${entityConfig.displayName}`}
                    </button>
                </div>
            </form>
        </div>
    );
}
