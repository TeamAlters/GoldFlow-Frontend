import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, getEntityReferences, mapReferenceItemsToOptions, updateEntity } from '../../admin/admin.api';
import type { ReferenceOption } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass, getCreateEditViewPageWrapperClass } from '../../../shared/utils/viewPageStyles';
import StaticUserForm, {
    type StaticUserFormData,
    type StaticUserFormRef,
} from './userForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
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

    const [capabilities, setCapabilities] = useState<CapabilitiesState>({
        canCreateDepartment: false,
        canViewActivity: false,
    });
    const userFormRef = useRef<StaticUserFormRef>(null);
    const [roleOptions, setRoleOptions] = useState<ReferenceOption[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const roleDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getEntityReferences('role')
            .then((items) => {
                const opts = mapReferenceItemsToOptions(items, 'id', 'name');
                if (opts.length === 0 && items.length > 0) {
                    const fallback = items.map((row) => {
                        const val = row.id ?? row.name ?? row.role_id ?? row.role_name;
                        const label = row.name ?? row.role_name ?? String(val ?? '');
                        return { value: String(val ?? ''), label: String(label || val || '') };
                    });
                    setRoleOptions(fallback);
                } else {
                    setRoleOptions(opts);
                }
            })
            .catch(() => setRoleOptions([]));
    }, []);

    useEffect(() => {
        if (!roleDropdownOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
                setRoleDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [roleDropdownOpen]);
   

    useEffect(() => {
        if (!id) return;
        setDataLoading(true);
        getEntity(ENTITY_NAME, id)
            .then((res) => {
                if (res.data && typeof res.data === 'object') {
                    const entity = res.data as Record<string, unknown>;
                    setInitialData(toInitialUserData(entity));
                    setCapabilities(capabilitiesFromEntity(entity));
                    const roleId = entity.role_id != null ? String(entity.role_id) : (entity.role && typeof entity.role === 'object' && 'id' in entity.role ? String((entity.role as Record<string, unknown>).id ?? '') : '');
                    setSelectedRoleId(roleId);
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
            payload.role_id = selectedRoleId;
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
        [id, navigate, entityConfig, capabilities, selectedRoleId]
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
    const sectionClass = getSectionClass(isDarkMode);
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
        <div className={getCreateEditViewPageWrapperClass(isDarkMode)}>
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
                <div className={sectionClass}>
                <StaticUserForm
                    ref={userFormRef}
                    initialData={initialData}
                    isEdit={true}
                    wrapInForm={false}
                    showActions={false}
                />

                <section className="mt-8 pt-6  border-gray-200 dark:border-gray-700">
                    <h2
                        className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                        Roles and Permissions
                    </h2>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Assign table-level permissions
                    </p>
                    <div className="mb-4 max-w-xs">
                        <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Role
                        </label>
                        <div ref={roleDropdownRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setRoleDropdownOpen((o) => !o)}
                                className={`w-full min-h-[42px] px-4 py-2.5 flex items-center justify-between text-left text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 ${roleDropdownOpen ? 'ring-2 ring-blue-500/30' : ''} ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                            >
                                <span className={!selectedRoleId ? (isDarkMode ? 'text-gray-500' : 'text-gray-400') : ''}>
                                    {roleOptions.find((o) => o.value === selectedRoleId)?.label ?? 'Select role'}
                                </span>
                                <svg
                                    className={`w-4 h-4 shrink-0 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {roleDropdownOpen && (
                                <div
                                    className={`absolute left-0 right-0 top-full z-50 mt-1 py-1 rounded-lg border shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedRoleId('');
                                            setRoleDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2.5 text-left text-sm ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} ${!selectedRoleId ? (isDarkMode ? 'bg-blue-600/20' : 'bg-blue-50') : ''}`}
                                    >
                                        Select role
                                    </button>
                                    {roleOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                setSelectedRoleId(opt.value);
                                                setRoleDropdownOpen(false);
                                            }}
                                            className={`w-full px-4 py-2.5 text-left text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} ${selectedRoleId === opt.value ? (isDarkMode ? 'bg-blue-600/20' : 'bg-blue-50') : ''}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mt-8 pt-6  border-gray-200 dark:border-gray-700">
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
                        {submitLoading ? 'Saving...' : 'Update'}
                    </button>
                </div>
                </div>
            </form>
        </div>
    );
}
