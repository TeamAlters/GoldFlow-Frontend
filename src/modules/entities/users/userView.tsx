import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticUserForm, { type StaticUserFormData } from './userForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
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

    const [capabilities, setCapabilities] = useState<CapabilitiesState>({
        canCreateDepartment: false,
        canViewActivity: false,
    });
    const [roleName, setRoleName] = useState<string>('');


    useEffect(() => {
        if (!id) return;
        setDataLoading(true);
        getEntity(ENTITY_NAME, id)
            .then((res) => {
                if (res.data && typeof res.data === 'object') {
                    const entity = res.data as Record<string, unknown>;
                    setInitialData(toInitialUserData(entity));
                    setCapabilities(capabilitiesFromEntity(entity));
                    let name = '';
                    if (entity.role_name != null && entity.role_name !== '') {
                        name = String(entity.role_name);
                    } else if (entity.role && typeof entity.role === 'object' && 'name' in entity.role) {
                        const r = entity.role as Record<string, unknown>;
                        name = r.name != null ? String(r.name) : '';
                    }
                    setRoleName(name);
                }
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : 'Failed to load user';
                showErrorToastUnlessAuth(msg);
            })
            .finally(() => setDataLoading(false));
    }, [id]);

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
                    <div className="mb-4 max-w-xs">
                        <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Role
                        </label>
                        <div
                            className={`min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                        >
                            {roleName || '—'}
                        </div>
                    </div>
                </section>

                <section className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
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
