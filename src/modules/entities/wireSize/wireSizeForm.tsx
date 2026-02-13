import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { FormSelect } from '../../../shared/components/FormSelect';
import { MAX_LENGTH_24, maxLengthError } from '../../../shared/utils/formValidation';

export type StaticWireSizeFormData = {
  wire_size: string;
  product_name: string;
};

export interface StaticWireSizeFormRef {
  getData: () => StaticWireSizeFormData;
  validate: () => boolean;
}

export interface ProductOption {
  value: string;
  label: string;
}

export interface StaticWireSizeFormProps {
  initialData?: Partial<StaticWireSizeFormData>;
  productOptions?: ProductOption[];
  onSubmit?: (data: StaticWireSizeFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
}

const emptyForm: StaticWireSizeFormData = {
  wire_size: '',
  product_name: '',
};

const StaticWireSizeFormInner = forwardRef<StaticWireSizeFormRef, StaticWireSizeFormProps>(
  function StaticWireSizeFormInner(
    {
      initialData,
      productOptions = [],
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
    const [formData, setFormData] = useState<StaticWireSizeFormData>({ ...emptyForm });
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

    const handleChange = (key: keyof StaticWireSizeFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
    };

    const validate = (): boolean => {
      const next: Record<string, string> = {};
      const ws = formData.wire_size.trim();
      if (!ws) next.wire_size = 'Wire size is required';
      else if (ws.length > MAX_LENGTH_24)
        next.wire_size = maxLengthError('Wire size', MAX_LENGTH_24);
      if (!formData.product_name.trim()) next.product_name = 'Product is required';
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
            Wire Size <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
          </label>
          <input
            type="text"
            value={formData.wire_size}
            onChange={(e) => handleChange('wire_size', e.target.value)}
            placeholder="e.g. 0.5mm, 1mm"
            maxLength={MAX_LENGTH_24}
            className={inputClass('wire_size')}
            disabled={readOnly}
            readOnly={readOnly}
          />
          {errors.wire_size && <p className={`mt-1 ${errorClass}`}>{errors.wire_size}</p>}
        </div>
        <div>
          <label className={labelClass}>
            Product <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
          </label>
          {productOptions.length > 0 ? (
            <FormSelect
              value={formData.product_name}
              onChange={(v) => handleChange('product_name', v)}
              options={productOptions}
              placeholder="Select product"
              disabled={readOnly}
              className={inputClass('product_name')}
              isDarkMode={isDarkMode}
            />
          ) : (
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => handleChange('product_name', e.target.value)}
              placeholder="Product name"
              maxLength={MAX_LENGTH_24}
              className={inputClass('product_name')}
              disabled={readOnly}
              readOnly={readOnly}
            />
          )}
          {errors.product_name && (
            <p className={`mt-1 ${errorClass}`}>{errors.product_name}</p>
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
            {submitLoading ? 'Saving...' : isEdit ? 'Update Wire Size' : 'Create Wire Size'}
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
  }
);

export default StaticWireSizeFormInner;
