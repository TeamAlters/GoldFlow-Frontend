import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { FormSelect } from '../../../shared/components/FormSelect';
import { MAX_TEXT_FIELD_LENGTH, maxLengthError } from '../../../shared/utils/formValidation';

export type StaticAccessoriesPurityRangeFormData = {
  accessories_purity_range: string;
  purity_range: string;
  accessory_purity: string;
};

export interface StaticAccessoriesPurityRangeFormRef {
  getData: () => StaticAccessoriesPurityRangeFormData;
  validate: () => boolean;
}

export interface DropdownOption {
  value: string;
  label: string;
}

export interface StaticAccessoriesPurityRangeFormProps {
  initialData?: Partial<StaticAccessoriesPurityRangeFormData>;
  purityRangeOptions?: DropdownOption[];
  accessoryPurityOptions?: DropdownOption[];
  onSubmit?: (data: StaticAccessoriesPurityRangeFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
}

const emptyForm: StaticAccessoriesPurityRangeFormData = {
  accessories_purity_range: '',
  purity_range: '',
  accessory_purity: '',
};

const StaticAccessoriesPurityRangeFormInner = forwardRef<
  StaticAccessoriesPurityRangeFormRef,
  StaticAccessoriesPurityRangeFormProps
>(function StaticAccessoriesPurityRangeFormInner(
  {
    initialData,
    purityRangeOptions = [],
    accessoryPurityOptions = [],
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
  const [formData, setFormData] = useState<StaticAccessoriesPurityRangeFormData>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useImperativeHandle(ref, () => ({
    getData: () => ({ ...formData }),
    validate: () => validate(),
  }));

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...emptyForm, ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (key: keyof StaticAccessoriesPurityRangeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const name = formData.accessories_purity_range.trim();
    if (!name) next.accessories_purity_range = 'Accessories purity range is required';
    else if (name.length > MAX_TEXT_FIELD_LENGTH)
      next.accessories_purity_range = maxLengthError('Accessories purity range');
    if (!formData.purity_range.trim()) next.purity_range = 'Purity range is required';
    if (!formData.accessory_purity.trim()) next.accessory_purity = 'Accessory purity is required';
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

  const renderSelect = (
    key: 'purity_range' | 'accessory_purity',
    options: DropdownOption[],
    placeholder: string
  ) =>
    options.length > 0 ? (
      <FormSelect
        value={formData[key]}
        onChange={(v) => handleChange(key, v)}
        options={options}
        placeholder={placeholder}
        disabled={readOnly}
        className={inputClass(key)}
        isDarkMode={isDarkMode}
      />
    ) : (
      <input
        type="text"
        value={formData[key]}
        onChange={(e) => handleChange(key, e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_TEXT_FIELD_LENGTH}
        className={inputClass(key)}
        disabled={readOnly}
        readOnly={readOnly}
      />
    );

  const fields = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className={labelClass}>
          Accessories Purity Range{' '}
          <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        <input
          type="text"
          value={formData.accessories_purity_range}
          onChange={(e) => handleChange('accessories_purity_range', e.target.value)}
          placeholder="e.g. APR-01"
          maxLength={MAX_TEXT_FIELD_LENGTH}
          className={inputClass('accessories_purity_range')}
          disabled={readOnly}
          readOnly={readOnly}
        />
        {errors.accessories_purity_range && (
          <p className={`mt-1 ${errorClass}`}>{errors.accessories_purity_range}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>
          Purity Range <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        {renderSelect('purity_range', purityRangeOptions, 'Select purity range')}
        {errors.purity_range && (
          <p className={`mt-1 ${errorClass}`}>{errors.purity_range}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>
          Accessory Purity <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        {renderSelect('accessory_purity', accessoryPurityOptions, 'Select accessory purity')}
        {errors.accessory_purity && (
          <p className={`mt-1 ${errorClass}`}>{errors.accessory_purity}</p>
        )}
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
          {submitLoading
            ? 'Saving...'
            : isEdit
              ? 'Update Accessories Purity Range'
              : 'Create Accessories Purity Range'}
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
  return <div className="space-y-6">{fields}</div>;
});

export default StaticAccessoriesPurityRangeFormInner;
