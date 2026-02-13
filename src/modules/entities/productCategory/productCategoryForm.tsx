import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { FormSelect } from '../../../shared/components/FormSelect';
import { MAX_LENGTH_36, maxLengthError } from '../../../shared/utils/formValidation';

export type StaticProductCategoryFormData = {
  product_category: string;
  product_name: string;
};

export interface StaticProductCategoryFormRef {
  getData: () => StaticProductCategoryFormData;
  validate: () => boolean;
}

export interface ProductOption {
  value: string;
  label: string;
}

export interface StaticProductCategoryFormProps {
  initialData?: Partial<StaticProductCategoryFormData>;
  productOptions?: ProductOption[];
  onSubmit?: (data: StaticProductCategoryFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
}

const emptyForm: StaticProductCategoryFormData = {
  product_category: '',
  product_name: '',
};

const StaticProductCategoryFormInner = forwardRef<
  StaticProductCategoryFormRef,
  StaticProductCategoryFormProps
>(function StaticProductCategoryFormInner(
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
  const [formData, setFormData] = useState<StaticProductCategoryFormData>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useImperativeHandle(ref, () => ({
    getData: () => ({ ...formData }),
    validate: () => validate(),
  }));

  const lastAppliedInitialRef = useRef<Partial<StaticProductCategoryFormData> | undefined>(undefined);
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

  const handleChange = (key: keyof StaticProductCategoryFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const name = formData.product_category.trim();
    if (!name) next.product_category = 'Product category is required';
    else if (name.length > MAX_LENGTH_36)
      next.product_category = maxLengthError('Product category', MAX_LENGTH_36);
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
          Product Category <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        <input
          type="text"
          value={formData.product_category}
          onChange={(e) => handleChange('product_category', e.target.value)}
          placeholder="e.g. Gold, Silver"
          maxLength={MAX_LENGTH_36}
          className={inputClass('product_category')}
          disabled={readOnly}
          readOnly={readOnly}
        />
        {errors.product_category && (
          <p className={`mt-1 ${errorClass}`}>{errors.product_category}</p>
        )}
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
            maxLength={MAX_LENGTH_36}
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
          {submitLoading ? 'Saving...' : isEdit ? 'Update Product Category' : 'Create Product Category'}
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

export default StaticProductCategoryFormInner;
