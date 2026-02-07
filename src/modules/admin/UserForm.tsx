import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/ui.store';

export type UserFormData = {
  name: string;
  email: string;
  role: string;
  mobileNo: string;
};

export type UserFormField = {
  key: keyof UserFormData;
  label: string;
  type: 'text' | 'email' | 'select' | 'tel';
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  validation?: (value: string) => string | null;
};

export interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isEdit?: boolean;
  fields?: UserFormField[];
}

const defaultFields: UserFormField[] = [
  {
    key: 'name',
    label: 'Full Name',
    type: 'text',
    required: true,
    placeholder: 'Enter full name',
    validation: (value) => {
      if (!value.trim()) return 'Name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      return null;
    },
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    placeholder: 'Enter email address',
    validation: (value) => {
      if (!value.trim()) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Please enter a valid email address';
      return null;
    },
  },
  {
    key: 'role',
    label: 'Role',
    type: 'select',
    required: true,
    options: [
      { label: 'Admin', value: 'Admin' },
      { label: 'Manager', value: 'Manager' },
      { label: 'Supervisor', value: 'Supervisor' },
      { label: 'Operator', value: 'Operator' },
    ],
  },
  {
    key: 'mobileNo',
    label: 'Mobile Number',
    type: 'tel',
    required: true,
    placeholder: 'Enter mobile number',
    validation: (value) => {
      if (!value.trim()) return 'Mobile number is required';
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
        return 'Please enter a valid 10-digit mobile number';
      }
      return null;
    },
  },
];

export default function UserForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  fields = defaultFields,
}: UserFormProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: '',
    mobileNo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [openSelectKey, setOpenSelectKey] = useState<string | null>(null);
  const selectDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  // Close role/select dropdown when clicking outside
  useEffect(() => {
    if (!openSelectKey) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (selectDropdownRef.current && !selectDropdownRef.current.contains(e.target as Node)) {
        setOpenSelectKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openSelectKey]);

  const handleChange = (key: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleBlur = (key: keyof UserFormData, field: UserFormField) => {
    setTouched((prev) => ({ ...prev, [key]: true }));

    if (field.validation) {
      const error = field.validation(formData[key]);
      if (error) {
        setErrors((prev) => ({ ...prev, [key]: error }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = formData[field.key];

      if (field.required && !value.trim()) {
        newErrors[field.key] = `${field.label} is required`;
      } else if (field.validation) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.key] = error;
        }
      }
    });

    setErrors(newErrors);
    setTouched(
      fields.reduce(
        (acc, field) => {
          acc[field.key] = true;
          return acc;
        },
        {} as Record<string, boolean>
      )
    );

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field: UserFormField) => {
    const value = formData[field.key];
    const error = errors[field.key];
    const isTouched = touched[field.key];
    const showError = isTouched && error;

    const baseInputClasses = `w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
      showError
        ? isDarkMode
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-500/10'
          : 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
        : isDarkMode
          ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-500'
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-400'
    }`;

    switch (field.type) {
      case 'select': {
        const isOpen = openSelectKey === field.key;
        const currentLabel = value
          ? (field.options?.find((o) => o.value === value)?.label ?? value)
          : `Select ${field.label}`;
        return (
          <div className="space-y-1">
            <div ref={isOpen ? selectDropdownRef : undefined} className="relative w-full min-w-0">
              <button
                type="button"
                onClick={() => setOpenSelectKey(isOpen ? null : field.key)}
                onBlur={() => handleBlur(field.key, field)}
                className={`${baseInputClasses} flex items-center justify-between text-left appearance-none cursor-pointer min-h-[42px] ${isOpen ? 'ring-2 ring-blue-500/30' : ''}`}
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isOpen && (
                <div
                  className={`absolute left-0 right-0 top-full z-50 mt-2 py-1 rounded-lg border shadow-lg box-border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleChange(field.key, '');
                      setOpenSelectKey(null);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm ${
                      isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${!value ? (isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700') : ''}`}
                  >
                    Select {field.label}
                  </button>
                  {field.options?.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleChange(field.key, option.value);
                        setOpenSelectKey(null);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm ${
                        isDarkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${value === option.value ? (isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700') : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {showError && (
              <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            )}
          </div>
        );
      }

      case 'text':
      case 'email':
      case 'tel':
      default:
        return (
          <div className="space-y-1">
            <input
              type={field.type}
              value={value}
              onChange={(e) => handleChange(field.key, e.target.value)}
              onBlur={() => handleBlur(field.key, field)}
              placeholder={field.placeholder}
              className={baseInputClasses}
            />
            {showError && (
              <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            )}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field.key}>
            <label
              className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {field.label}
              {field.required && (
                <span className={`ml-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>*</span>
              )}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
              : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {isEdit ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
            <span>{isEdit ? 'Update User' : 'Create User'}</span>
          </div>
        </button>
      </div>
    </form>
  );
}
