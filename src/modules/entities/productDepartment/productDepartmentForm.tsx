import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { FormSelect } from '../../../shared/components/FormSelect';
import {
  MAX_NUMERIC_52_LENGTH,
  validateNumeric52,
  sanitizeNumeric52Input,
} from '../../../shared/utils/formValidation';
import type { FormSelectOption } from '../../../shared/components/FormSelect';

export type ProductDepartmentFormData = {
  product: string;
  department_group: string;
  department: string;
  step_no: string;
  requires_issue: boolean;
  requires_receive: boolean;
  allows_loss: boolean;
  loss_percentage: string;
  is_optional: boolean;
  allow_rework: boolean;
  is_final_department: boolean;
  allow_wastage: boolean;
  allow_weight_changes: boolean;
  approval_required: boolean;
  expected_processing_time_mins: string;
  show_delay_alert: boolean;
  allow_weight_splits: boolean;
  loss_requires_reason: boolean;
  loss_approval_required: boolean;
  grouped_by_parent_melting_lot: boolean;
};

export interface ProductDepartmentFormRef {
  getData: () => ProductDepartmentFormData;
  validate: () => boolean;
}

export interface ProductDepartmentFormProps {
  initialData?: Partial<ProductDepartmentFormData>;
  productOptions?: FormSelectOption[];
  departmentGroupOptions?: FormSelectOption[];
  departmentOptions?: FormSelectOption[];
  onSubmit?: (data: ProductDepartmentFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
  /** Which sections to render. Default: both. Use ['configurations'] for modal that only edits config. */
  showSections?: Array<'departmentDetails' | 'configurations'>;
}

const emptyForm: ProductDepartmentFormData = {
  product: '',
  department_group: '',
  department: '',
  step_no: '',
  requires_issue: false,
  requires_receive: false,
  allows_loss: false,
  loss_percentage: '',
  is_optional: false,
  allow_rework: false,
  is_final_department: false,
  allow_wastage: false,
  allow_weight_changes: false,
  approval_required: false,
  expected_processing_time_mins: '',
  show_delay_alert: false,
  allow_weight_splits: false,
  loss_requires_reason: false,
  loss_approval_required: false,
  grouped_by_parent_melting_lot: false,
};

const BOOLEAN_FIELDS: (keyof ProductDepartmentFormData)[] = [
  'requires_issue',
  'requires_receive',
  'allows_loss',
  'is_optional',
  'allow_rework',
  'is_final_department',
  'allow_wastage',
  'allow_weight_changes',
  'approval_required',
  'show_delay_alert',
  'allow_weight_splits',
  'loss_requires_reason',
  'loss_approval_required',
  'grouped_by_parent_melting_lot',
];

const BOOLEAN_FIELD_LABELS: Partial<Record<keyof ProductDepartmentFormData, string>> = {
  grouped_by_parent_melting_lot: 'Grouped by parent melting lot',
};

const ProductDepartmentFormInner = forwardRef<
  ProductDepartmentFormRef,
  ProductDepartmentFormProps
>(function ProductDepartmentFormInner(
  {
    initialData,
    productOptions = [],
    departmentGroupOptions = [],
    departmentOptions = [],
    onSubmit,
    onCancel,
    isEdit = false,
    readOnly = false,
    submitLoading = false,
    wrapInForm = true,
    showActions = true,
    showSections = ['departmentDetails', 'configurations'],
  },
  ref
) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const [formData, setFormData] = useState<ProductDepartmentFormData>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useImperativeHandle(ref, () => ({
    getData: () => ({ ...formData }),
    validate: () => validate(),
  }));

  const lastAppliedInitialRef = useRef<Partial<ProductDepartmentFormData> | undefined>(undefined);
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

  const handleChange = (key: keyof ProductDepartmentFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!formData.product.trim()) next.product = 'Product is required';
    if (!formData.department_group.trim()) next.department_group = 'Department group is required';
    if (!formData.department.trim()) next.department = 'Department is required';

    const stepNo = formData.step_no.trim();
    if (!stepNo) next.step_no = 'Step no is required';
    else {
      const num = parseInt(stepNo, 10);
      if (!Number.isInteger(num) || num < 1) next.step_no = 'Step no must be a positive integer (≥1)';
    }

    if (formData.loss_percentage.trim()) {
      const err = validateNumeric52(formData.loss_percentage, 'Loss percentage', { nonNegative: true });
      if (err) next.loss_percentage = err;
      else {
        const num = parseFloat(formData.loss_percentage.trim());
        if (Number.isFinite(num) && num > 100) {
          next.loss_percentage = 'Loss percentage must be between 0 and 100';
        }
      }
    }

    if (formData.expected_processing_time_mins.trim()) {
      const num = parseInt(formData.expected_processing_time_mins, 10);
      if (!Number.isInteger(num) || num < 0)
        next.expected_processing_time_mins = 'Expected processing time must be zero or greater';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && onSubmit) onSubmit(formData);
  };

  const inputClass = (key: string) =>
    `w-full min-h-[42px] px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
      errors[key]
        ? isDarkMode
          ? 'border-red-500 focus:ring-red-500/20 bg-red-500/10'
          : 'border-red-300 focus:ring-red-500/20 bg-red-50'
        : isDarkMode
          ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
    }`;

  const sectionHeadingClass = `text-lg font-semibold mb-4 pb-2 border-b ${
    isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
  }`;

  const labelClass = `block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;
  const errorClass = `text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`;

  const sanitizeStepNo = (v: string): string => {
    const digits = v.replace(/[^\d]/g, '');
    if (digits === '') return '';
    const num = parseInt(digits, 10);
    if (num > 9999) return '9999';
    return digits;
  };

  const sanitizeIntMins = (v: string): string => {
    const digits = v.replace(/[^\d]/g, '');
    if (digits === '') return '';
    const num = parseInt(digits, 10);
    if (num > 999999) return '999999';
    return digits;
  };

  const sectionClass = `border rounded-lg p-4 mb-4 ${
    isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
  }`;

  const fields = (
    <div className="space-y-6">
      {showSections.includes('departmentDetails') && (
      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Department Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
          <div>
            <label className={labelClass}>
              Product <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            <FormSelect
              value={formData.product}
              onChange={(v) => handleChange('product', v)}
              options={productOptions}
              placeholder="Select product"
              disabled={readOnly}
              className={inputClass('product')}
              isDarkMode={isDarkMode}
            />
            {errors.product && <p className={`mt-1 ${errorClass}`}>{errors.product}</p>}
          </div>
          <div>
            <label className={labelClass}>
              Department Group <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            <FormSelect
              value={formData.department_group}
              onChange={(v) => handleChange('department_group', v)}
              options={departmentGroupOptions}
              placeholder="Select department group"
              disabled={readOnly}
              className={inputClass('department_group')}
              isDarkMode={isDarkMode}
            />
            {errors.department_group && (
              <p className={`mt-1 ${errorClass}`}>{errors.department_group}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Department <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            <FormSelect
              value={formData.department}
              onChange={(v) => handleChange('department', v)}
              options={departmentOptions}
              placeholder="Select department"
              disabled={readOnly}
              className={inputClass('department')}
              isDarkMode={isDarkMode}
            />
            {errors.department && <p className={`mt-1 ${errorClass}`}>{errors.department}</p>}
          </div>
          <div>
            <label className={labelClass}>
              Step No <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.step_no}
              onChange={(e) => handleChange('step_no', sanitizeStepNo(e.target.value))}
              placeholder="e.g. 1, 2, 3"
              maxLength={5}
              className={inputClass('step_no')}
              disabled={readOnly}
              readOnly={readOnly}
            />
            {errors.step_no && <p className={`mt-1 ${errorClass}`}>{errors.step_no}</p>}
          </div>
        </div>
      </div>
      )}

      {showSections.includes('configurations') && (
      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Configurations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
          {BOOLEAN_FIELDS.map((key) => (
            <label
              key={key}
              className={`flex items-center gap-2 cursor-pointer ${readOnly ? 'cursor-default' : ''}`}
            >
              <input
                type="checkbox"
                checked={formData[key] as boolean}
                onChange={(e) => handleChange(key, e.target.checked)}
                disabled={readOnly}
                className={`rounded ${isDarkMode ? 'accent-blue-500' : 'accent-blue-600'}`}
              />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {BOOLEAN_FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-6">
          <div>
            <label className={labelClass}>Loss Percentage</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.loss_percentage}
              onChange={(e) =>
                handleChange('loss_percentage', sanitizeNumeric52Input(e.target.value))
              }
              placeholder="e.g. 0.50 (0–100)"
              maxLength={MAX_NUMERIC_52_LENGTH}
              className={inputClass('loss_percentage')}
              disabled={readOnly}
              readOnly={readOnly}
            />
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter a value between 0 and 100
            </p>
            {errors.loss_percentage && (
              <p className={`mt-1 ${errorClass}`}>{errors.loss_percentage}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Expected Processing Time (mins)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.expected_processing_time_mins}
              onChange={(e) =>
                handleChange('expected_processing_time_mins', sanitizeIntMins(e.target.value))
              }
              placeholder="e.g. 0, 30, 60"
              maxLength={7}
              className={inputClass('expected_processing_time_mins')}
              disabled={readOnly}
              readOnly={readOnly}
            />
            {errors.expected_processing_time_mins && (
              <p className={`mt-1 ${errorClass}`}>{errors.expected_processing_time_mins}</p>
            )}
          </div>
        </div>
      </div>
      )}
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
              ? 'Update Product Department'
              : 'Create Product Department'}
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

export default ProductDepartmentFormInner;
