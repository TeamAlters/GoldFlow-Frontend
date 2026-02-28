import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../../../stores/ui.store';
import { FormSelect } from '../../../shared/components/FormSelect';
import { MAX_NUMERIC_63_LENGTH, MAX_TEXT_FIELD_LENGTH, maxLengthError, sanitizeNumeric63Input, validateNumeric63 } from '../../../shared/utils/formValidation';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';

export type StaticCustomerMasterFormData = {
  customer_name: string;
  purity: string;
  issue_purity: string;
  product_name: string;
  product_category: string;
  machine_size: string;
  design_name: string;
  wastage: string;
};

export interface StaticCustomerMasterFormRef {
  getData: () => StaticCustomerMasterFormData;
  validate: () => boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface StaticCustomerMasterFormProps {
  initialData?: Partial<StaticCustomerMasterFormData>;
  purityOptions?: SelectOption[];
  productOptions?: SelectOption[];
  productCategoryOptions?: SelectOption[];
  machineOptions?: SelectOption[];
  designOptions?: SelectOption[];
  onProductNameChange?: (productName: string) => void;
  onSubmit?: (data: StaticCustomerMasterFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
}

const emptyForm: StaticCustomerMasterFormData = {
  customer_name: '',
  purity: '',
  issue_purity: '',
  product_name: '',
  product_category: '',
  machine_size: '',
  design_name: '',
  wastage: '',
};

function parseNum(s: string): number | null {
  const t = s.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const StaticCustomerMasterFormInner = forwardRef<
  StaticCustomerMasterFormRef,
  StaticCustomerMasterFormProps
>(function CustomerFormInner(
  {
    initialData,
    purityOptions = [],
    productOptions = [],
    productCategoryOptions = [],
    machineOptions = [],
    designOptions = [],
    onProductNameChange,
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
  const [formData, setFormData] = useState<StaticCustomerMasterFormData>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useImperativeHandle(ref, () => ({
    getData: () => ({ ...formData }),
    validate: () => validate(),
  }));

  const lastAppliedInitialRef = useRef<Partial<StaticCustomerMasterFormData> | undefined>(undefined);
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

  const handleChange = (key: keyof StaticCustomerMasterFormData, value: string) => {
    if (key === 'issue_purity' || key === 'wastage') value = sanitizeNumeric63Input(value);
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'product_name') {
        next.design_name = '';
        next.machine_size = '';
        onProductNameChange?.(value);
      }
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const name = formData.customer_name.trim();
    if (!name) next.customer_name = 'Customer name is required';
    else if (name.length > MAX_TEXT_FIELD_LENGTH)
      next.customer_name = maxLengthError('Customer name', 32);
    if (!formData.purity.trim()) next.purity = 'Purity is required';
    if (!formData.product_name.trim()) next.product_name = 'Product is required';
    if (formData.issue_purity.trim() !== '') {
      const err = validateNumeric63(formData.issue_purity, 'Issue purity', { nonNegative: true });
      if (err) next.issue_purity = err;
    }
    if (formData.wastage.trim() !== '') {
      const err = validateNumeric63(formData.wastage, 'Wastage', { nonNegative: true });
      if (err) next.wastage = err;
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

  const renderSelect = (
    key: 'purity' | 'product_name' | 'product_category' | 'machine_size' | 'design_name',
    options: SelectOption[],
    placeholder: string
  ) => {
    const value = formData[key];
    if (readOnly && value) {
      const route = getEntityDetailRoute(key, value);
      if (route) {
        return (
          <div className={`w-full min-h-[42px] px-4 py-2.5 flex items-center text-sm rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
            <Link to={route} className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}>
              {value}
            </Link>
          </div>
        );
      }
    }
    if (options.length > 0) {
      return (
        <FormSelect
          value={value}
          onChange={(v) => handleChange(key, v)}
          options={options}
          placeholder={placeholder}
          disabled={readOnly}
          className={inputClass(key)}
          isDarkMode={isDarkMode}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(key, e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_TEXT_FIELD_LENGTH}
        className={inputClass(key)}
        disabled={readOnly}
        readOnly={readOnly}
      />
    );
  };

  const fields = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className={labelClass}>
          Customer Name <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        <input
          type="text"
          value={formData.customer_name}
          onChange={(e) => handleChange('customer_name', e.target.value)}
          placeholder="Customer name"
          maxLength={MAX_TEXT_FIELD_LENGTH}
          className={inputClass('customer_name')}
          disabled={readOnly}
          readOnly={readOnly}
        />
        {errors.customer_name && (
          <p className={`mt-1 ${errorClass}`}>{errors.customer_name}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>
          Purity <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        {renderSelect('purity', purityOptions, 'Select purity')}
        {errors.purity && <p className={`mt-1 ${errorClass}`}>{errors.purity}</p>}
      </div>
      <div>
        <label className={labelClass}>Issue Purity</label>
        <input
          type="text"
          inputMode="decimal"
          value={formData.issue_purity}
          onChange={(e) => handleChange('issue_purity', e.target.value)}
          placeholder="e.g. 99.50"
          maxLength={MAX_NUMERIC_63_LENGTH}
          className={inputClass('issue_purity')}
          disabled={readOnly}
          readOnly={readOnly}
        />
        {errors.issue_purity && (
          <p className={`mt-1 ${errorClass}`}>{errors.issue_purity}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>
          Product <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        {renderSelect('product_name', productOptions, 'Select product')}
        {errors.product_name && (
          <p className={`mt-1 ${errorClass}`}>{errors.product_name}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>Product Category</label>
        {renderSelect('product_category', productCategoryOptions, 'Select product category')}
        {errors.product_category && (
          <p className={`mt-1 ${errorClass}`}>{errors.product_category}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>Machine Size</label>
        {renderSelect('machine_size', machineOptions, 'Select machine')}
        {errors.machine_size && (
          <p className={`mt-1 ${errorClass}`}>{errors.machine_size}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>Design Name</label>
        {renderSelect('design_name', designOptions, 'Select design')}
        {errors.design_name && (
          <p className={`mt-1 ${errorClass}`}>{errors.design_name}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>Wastage</label>
        <input
          type="text"
          inputMode="decimal"
          value={formData.wastage}
          onChange={(e) => handleChange('wastage', e.target.value)}
          placeholder="e.g. 0.125"
          maxLength={MAX_NUMERIC_63_LENGTH}
          className={inputClass('wastage')}
          disabled={readOnly}
          readOnly={readOnly}
        />
        {errors.wastage && <p className={`mt-1 ${errorClass}`}>{errors.wastage}</p>}
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
              ? 'Update Customer Details'
              : 'Create Customer Details'}
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

export default StaticCustomerMasterFormInner;
