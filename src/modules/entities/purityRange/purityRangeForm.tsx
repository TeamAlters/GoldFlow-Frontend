import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { MAX_TEXT_FIELD_LENGTH, maxLengthError } from '../../../shared/utils/formValidation';

export type StaticPurityRangeFormData = {
  purity_range: string;
  from_value: string;
  to_value: string;
  purity: string;
};

export interface StaticPurityRangeFormRef {
  getData: () => StaticPurityRangeFormData;
  validate: () => boolean;
}

export interface PurityOption {
  value: string;
  label: string;
}

export interface StaticPurityRangeFormProps {
  initialData?: Partial<StaticPurityRangeFormData>;
  purityOptions?: PurityOption[];
  onSubmit?: (data: StaticPurityRangeFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
}

const emptyForm: StaticPurityRangeFormData = {
  purity_range: '',
  from_value: '',
  to_value: '',
  purity: '',
};

const StaticPurityRangeFormInner = forwardRef<
  StaticPurityRangeFormRef,
  StaticPurityRangeFormProps
>(function StaticPurityRangeFormInner(
  {
    initialData,
    purityOptions = [],
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
  const [formData, setFormData] = useState<StaticPurityRangeFormData>({ ...emptyForm });
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

  const handleChange = (key: keyof StaticPurityRangeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const name = formData.purity_range.trim();
    if (!name) next.purity_range = 'Purity range is required';
    else if (name.length > MAX_TEXT_FIELD_LENGTH)
      next.purity_range = maxLengthError('Purity range');

    const fromStr = formData.from_value.trim();
    if (!fromStr) next.from_value = 'From value is required';
    else {
      const fromNum = parseFloat(fromStr);
      if (Number.isNaN(fromNum)) next.from_value = 'Enter a valid number';
    }

    const toStr = formData.to_value.trim();
    if (!toStr) next.to_value = 'To value is required';
    else {
      const toNum = parseFloat(toStr);
      if (Number.isNaN(toNum)) next.to_value = 'Enter a valid number';
    }

    if (!formData.purity.trim()) next.purity = 'Purity is required';

    if (!next.from_value && !next.to_value && fromStr && toStr) {
      const fromNum = parseFloat(fromStr);
      const toNum = parseFloat(toStr);
      if (fromNum > toNum) next.to_value = 'To value must be greater than or equal to from value';
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
          Purity Range{' '}
          <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        <input
          type="text"
          value={formData.purity_range}
          onChange={(e) => handleChange('purity_range', e.target.value)}
          placeholder="e.g. Range-01"
          maxLength={MAX_TEXT_FIELD_LENGTH}
          className={inputClass('purity_range')}
          disabled={readOnly}
          readOnly={readOnly}
        />
        {errors.purity_range && (
          <p className={`mt-1 ${errorClass}`}>{errors.purity_range}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>
          From Value{' '}
          <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={formData.from_value}
          onChange={(e) => handleChange('from_value', e.target.value)}
          placeholder="e.g. 0.000"
          className={inputClass('from_value')}
          disabled={readOnly}
          readOnly={readOnly}
        />
        {errors.from_value && (
          <p className={`mt-1 ${errorClass}`}>{errors.from_value}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>
          To Value <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={formData.to_value}
          onChange={(e) => handleChange('to_value', e.target.value)}
          placeholder="e.g. 99.999"
          className={inputClass('to_value')}
          disabled={readOnly}
          readOnly={readOnly}
        />
        {errors.to_value && (
          <p className={`mt-1 ${errorClass}`}>{errors.to_value}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>
          Purity <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        {purityOptions.length > 0 ? (
          <select
            value={formData.purity}
            onChange={(e) => handleChange('purity', e.target.value)}
            className={inputClass('purity')}
            disabled={readOnly}
          >
            <option value="">Select purity</option>
            {purityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={formData.purity}
            onChange={(e) => handleChange('purity', e.target.value)}
            placeholder="Purity"
            maxLength={MAX_TEXT_FIELD_LENGTH}
            className={inputClass('purity')}
            disabled={readOnly}
            readOnly={readOnly}
          />
        )}
        {errors.purity && (
          <p className={`mt-1 ${errorClass}`}>{errors.purity}</p>
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
              ? 'Update Purity Range'
              : 'Create Purity Range'}
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

export default StaticPurityRangeFormInner;
