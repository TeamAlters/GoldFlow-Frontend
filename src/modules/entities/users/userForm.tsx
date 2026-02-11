import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { MAX_TEXT_FIELD_LENGTH, maxLengthError } from '../../../shared/utils/formValidation';

export type StaticUserFormData = {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    mobile_number: string;
    is_superuser: string;
    status: string;
};

export interface StaticUserFormRef {
    getData: () => StaticUserFormData;
    validate: () => boolean;
}

export interface StaticUserFormProps {
    initialData?: Partial<StaticUserFormData>;
    onSubmit?: (data: StaticUserFormData) => void;
    onCancel?: () => void;
    isEdit?: boolean;
    /** When true, all fields are disabled (read-only view). */
    readOnly?: boolean;
    submitLoading?: boolean;
    /** When false, render only fields (no form tag, no buttons). Parent must use ref to get data/validate. */
    wrapInForm?: boolean;
    /** When false, do not render Cancel/Create User buttons. Default true. */
    showActions?: boolean;
}

const STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suspended', value: 'suspended' },
];

const SUPERUSER_OPTIONS = [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
];

const emptyForm: StaticUserFormData = {
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    mobile_number: '',
    is_superuser: 'false',
    status: 'active',
};

const StaticUserFormInner = forwardRef<StaticUserFormRef, StaticUserFormProps>(
    function StaticUserFormInner(
        {
            initialData,
            onSubmit,
            onCancel,
            isEdit = false,
            readOnly = false,
            submitLoading = false,
            wrapInForm = true,
            showActions = true,
        },
        ref
    ) {
        const isDarkMode = useUIStore((state) => state.isDarkMode);
        const [formData, setFormData] = useState<StaticUserFormData>({ ...emptyForm });
        const [errors, setErrors] = useState<Record<string, string>>({});
        const [openSelectKey, setOpenSelectKey] = useState<string | null>(null);
        const selectRef = useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => ({
            getData: () => ({ ...formData }),
            validate: () => validate(),
        }));

        useEffect(() => {
            if (initialData) {
                setFormData((prev) => ({
                    ...emptyForm,
                    ...prev,
                    ...initialData,
                    password: prev.password,
                    confirm_password: prev.confirm_password,
                }));
            }
        }, [initialData]);

        useEffect(() => {
            if (!openSelectKey) return;
            const handleClick = (e: MouseEvent) => {
                if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
                    setOpenSelectKey(null);
                }
            };
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }, [openSelectKey]);

        const handleChange = (key: keyof StaticUserFormData, value: string) => {
            setFormData((prev) => ({ ...prev, [key]: value }));
            if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
        };

        const validate = (): boolean => {
            const next: Record<string, string> = {};
            const username = formData.username.trim();
            if (!username) next.username = 'Username is required';
            else if (username.length > MAX_TEXT_FIELD_LENGTH)
                next.username = maxLengthError('Username');
            const email = formData.email.trim();
            if (!email) next.email = 'Email is required';
            else if (email.length > MAX_TEXT_FIELD_LENGTH)
                next.email = maxLengthError('Email');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                next.email = 'Enter a valid email';
            }
            const mobile = formData.mobile_number.trim();
            if (mobile && mobile.length > MAX_TEXT_FIELD_LENGTH)
                next.mobile_number = maxLengthError('Mobile number');
            if (!isEdit) {
                if (!formData.password) next.password = 'Password is required';
                else if (formData.password.length < 8) next.password = 'Password must be at least 8 characters';
                if (formData.password !== formData.confirm_password) {
                    next.confirm_password = 'Passwords do not match';
                }
            }
            setErrors(next);
            return Object.keys(next).length === 0;
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (validate() && onSubmit) onSubmit(formData);
        };

        const inputClass = (key: string) =>
            `w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${errors[key]
                ? isDarkMode
                    ? 'border-red-500 focus:ring-red-500/20 bg-red-500/10'
                    : 'border-red-300 focus:ring-red-500/20 bg-red-50'
                : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
            }`;

        const labelClass = `block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;
        const errorClass = `text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`;

        const renderSelect = (
            key: 'status' | 'is_superuser',
            label: string,
            options: Array<{ label: string; value: string }>,
            value: string
        ) => {
            const currentLabel = options.find((o) => o.value === value)?.label ?? `Select ${label}`;
            if (readOnly) {
                return (
                    <div
                        className={`min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                    >
                        {currentLabel}
                    </div>
                );
            }
            const isOpen = openSelectKey === key;
            return (
                <div ref={key === openSelectKey ? selectRef : undefined} className="relative">
                    <button
                        type="button"
                        onClick={() => setOpenSelectKey(isOpen ? null : key)}
                        className={`${inputClass(key)} flex items-center justify-between text-left min-h-[42px] ${isOpen ? 'ring-2 ring-blue-500/30' : ''}`}
                    >
                        <span className={!value ? (isDarkMode ? 'text-gray-500' : 'text-gray-400') : ''}>
                            {currentLabel}
                        </span>
                        <svg
                            className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isOpen && (
                        <div
                            className={`absolute left-0 right-0 top-full z-50 mt-1 py-1 rounded-lg border shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                }`}
                        >
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        handleChange(key, opt.value);
                                        setOpenSelectKey(null);
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                        } ${value === opt.value ? (isDarkMode ? 'bg-blue-600/20' : 'bg-blue-50') : ''}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                    {errors[key] && <p className={`mt-1 ${errorClass}`}>{errors[key]}</p>}
                </div>
            );
        };

        const fields = (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>
                            Username <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => handleChange('username', e.target.value)}
                            placeholder="Enter username"
                            maxLength={MAX_TEXT_FIELD_LENGTH}
                            className={inputClass('username')}
                            disabled={isEdit || readOnly}
                            readOnly={readOnly}
                        />
                        {errors.username && <p className={`mt-1 ${errorClass}`}>{errors.username}</p>}
                    </div>

                    <div>
                        <label className={labelClass}>
                            Email <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="Enter email"
                            maxLength={MAX_TEXT_FIELD_LENGTH}
                            className={inputClass('email')}
                            disabled={readOnly}
                            readOnly={readOnly}
                        />
                        {errors.email && <p className={`mt-1 ${errorClass}`}>{errors.email}</p>}
                    </div>

                    {!isEdit && !readOnly && (
                        <>
                            <div>
                                <label className={labelClass}>
                                    Password <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    placeholder="Enter password"
                                    className={inputClass('password')}
                                />
                                {errors.password && <p className={`mt-1 ${errorClass}`}>{errors.password}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>
                                    Confirm Password <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.confirm_password}
                                    onChange={(e) => handleChange('confirm_password', e.target.value)}
                                    placeholder="Confirm password"
                                    className={inputClass('confirm_password')}
                                />
                                {errors.confirm_password && (
                                    <p className={`mt-1 ${errorClass}`}>{errors.confirm_password}</p>
                                )}
                            </div>
                        </>
                    )}

                    <div>
                        <label className={labelClass}>Mobile Number</label>
                        <input
                            type="tel"
                            value={formData.mobile_number}
                            onChange={(e) => handleChange('mobile_number', e.target.value)}
                            placeholder="Enter mobile number"
                            maxLength={MAX_TEXT_FIELD_LENGTH}
                            className={inputClass('mobile_number')}
                            disabled={readOnly}
                            readOnly={readOnly}
                        />
                        {errors.mobile_number && (
                            <p className={`mt-1 ${errorClass}`}>{errors.mobile_number}</p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Superuser</label>
                        {renderSelect('is_superuser', 'Superuser', SUPERUSER_OPTIONS, formData.is_superuser)}
                    </div>

                    <div>
                        <label className={labelClass}>Status</label>
                        {renderSelect('status', 'Status', STATUS_OPTIONS, formData.status)}
                    </div>
                </div>
            </>
        );

        const actions = showActions && (
            <div className="flex items-center justify-end gap-3 pt-4 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
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
                    {submitLoading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
                </button>
            </div>
        );

        if (wrapInForm) {
            return (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {fields}
                    {actions}
                </form>
            );
        }
        return (
            <div className="space-y-6">
                {fields}
            </div>
        );
    }
);

export default StaticUserFormInner;
