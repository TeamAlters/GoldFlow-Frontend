import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import {
  MAX_LENGTH_4,
  MAX_DEPARTMENT_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  validateTextMaxLength,
  getTextInputDescription,
  sanitizeDepartmentAbbreviationInput,
  validateUppercaseOnly,
} from '../../../shared/utils/formValidation';
import { FormFieldHint } from '../../../shared/components/FormFieldHint';

export type StaticDepartmentFormData = {
  abbreviation: string;
  name: string;
  description: string;
};

export interface StaticDepartmentFormRef {
  getData: () => StaticDepartmentFormData;
  validate: () => boolean;
}

export interface StaticDepartmentFormProps {
  initialData?: Partial<StaticDepartmentFormData>;
  onSubmit?: (data: StaticDepartmentFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
}

const emptyForm: StaticDepartmentFormData = {
  abbreviation: '',
  name: '',
  description: '',
};

const StaticDepartmentFormInner = forwardRef<
  StaticDepartmentFormRef,
  StaticDepartmentFormProps
>(function StaticDepartmentFormInner(
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
  const [formData, setFormData] = useState<StaticDepartmentFormData>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useImperativeHandle(ref, () => ({
    getData: () => ({ ...formData }),
    validate: () => validate(),
  }));

  const lastAppliedInitialRef = useRef<Partial<StaticDepartmentFormData> | undefined>(undefined);
  useEffect(() => {
    if (initialData) {
      if (lastAppliedInitialRef.current !== initialData) {
        lastAppliedInitialRef.current = initialData;
        setFormData((prev) => ({ ...emptyForm, ...prev, ...initialData }));
      }
    } else {
      lastAppliedInitialRef.current = undefined;
    }
  }, [initialData]);

  const handleChange = (key: keyof StaticDepartmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const abbr = formData.abbreviation.trim();
    if (!abbr) next.abbreviation = 'Department abbreviation is required';
    else {
      const lenErr = validateTextMaxLength(abbr, 'Department abbreviation', MAX_LENGTH_4);
      if (lenErr) next.abbreviation = lenErr;
      else {
        const err = validateUppercaseOnly(abbr, 'Department abbreviation');
        if (err) next.abbreviation = err;
      }
    }
    const name = formData.name.trim();
    if (!name) next.name = 'Department name is required';
    else {
      const err = validateTextMaxLength(name, 'Department name', MAX_DEPARTMENT_NAME_LENGTH);
      if (err) next.name = err;
    }
    const desc = formData.description.trim();
    if (desc) {
      const err = validateTextMaxLength(desc, 'Description', MAX_DESCRIPTION_LENGTH);
      if (err) next.description = err;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && onSubmit) onSubmit(formData);
  };

  const inputClass = (key: string) =>
    `w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
      errors[key]
        ? isDarkMode
          ? 'border-red-500 focus:ring-red-500/20 bg-red-500/10'
          : 'border-red-300 focus:ring-red-500/20 bg-red-50'
        : isDarkMode
          ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
    }`;

  const labelClass = `block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;
  const errorClass = `text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`;

  const fields = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className={labelClass}>
          Department Abbreviation <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        <input
          type="text"
          value={formData.abbreviation}
          onChange={(e) => handleChange('abbreviation', sanitizeDepartmentAbbreviationInput(e.target.value))}
          placeholder="e.g. ABCD"
          maxLength={MAX_LENGTH_4}
          className={`${inputClass('abbreviation')} uppercase`}
          disabled={readOnly}
          readOnly={readOnly}
        />
        <FormFieldHint>Enter up to {MAX_LENGTH_4} uppercase letters only</FormFieldHint>
     
        {errors.abbreviation && <p className={`mt-1 ${errorClass}`}>{errors.abbreviation}</p>}
      </div>
      <div>
        <label className={labelClass}>
          Department Name <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter department name"
          maxLength={MAX_DEPARTMENT_NAME_LENGTH}
          className={inputClass('name')}
          disabled={readOnly}
          readOnly={readOnly}
        />
        <FormFieldHint>{getTextInputDescription(MAX_DEPARTMENT_NAME_LENGTH)}</FormFieldHint>
 
        {errors.name && <p className={`mt-1 ${errorClass}`}>{errors.name}</p>}
      </div>
      <div className="md:col-span-2">
        <label className={labelClass}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter description"
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows={3}
          className={`${inputClass('description')} resize-none`}
          disabled={readOnly}
          readOnly={readOnly}
        />
        <FormFieldHint>{getTextInputDescription(MAX_DESCRIPTION_LENGTH)}</FormFieldHint>
        {errors.description && <p className={`mt-1 ${errorClass}`}>{errors.description}</p>}
      </div>
    </div>
  );

  const actions =
    showActions &&
    !readOnly && (
      <div className="flex items-center justify-end gap-3 pt-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitLoading}
          className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:opacity-60`}
        >
          {submitLoading ? 'Saving...' : isEdit ? 'Update Department' : 'Create Department'}
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
});

export default StaticDepartmentFormInner;
