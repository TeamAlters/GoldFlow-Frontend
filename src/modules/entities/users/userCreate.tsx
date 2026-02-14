import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity } from '../../admin/admin.api';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticUserForm, {
    type StaticUserFormData,
    type StaticUserFormRef,
} from './userForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { getEntityReferences, mapReferenceItemsToOptions, type ReferenceOption } from '../../admin/admin.api';

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

    const [submitLoading, setSubmitLoading] = useState(false);

    const [capabilities, setCapabilities] = useState<CapabilitiesState>({
        canCreateDepartment: false,
        canViewActivity: false,
    });
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');   
    const [roleOptions, setRoleOptions] = useState<ReferenceOption[]>([]);
    const userFormRef = useRef<StaticUserFormRef>(null);
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

    const handleSubmit = useCallback(
        async (formData: StaticUserFormData) => {
            const payload = toUserPayload(formData, false, capabilities);
            payload.role_id = selectedRoleId;
            setSubmitLoading(true);
            try {
                const res = await createEntity(ENTITY_NAME, payload);
                toast.success(`${entityConfig.displayName} created successfully.`);
                const id = getCreatedEntityId(res, payload as Record<string, unknown>, ['id', 'username']);
                navigate(id != null ? entityConfig.routes.detail.replace(':id', encodeURIComponent(String(id))) : entityConfig.routes.list);
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Request failed';
                showErrorToastUnlessAuth(msg);
            } finally {
                setSubmitLoading(false);
            }
        },
        [navigate, entityConfig, capabilities, selectedRoleId  ]    // Add selectedRoleId to dependencies
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
