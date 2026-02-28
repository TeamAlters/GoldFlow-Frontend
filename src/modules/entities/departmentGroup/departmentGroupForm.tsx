import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../../../stores/ui.store';
import {
  MAX_DEPARTMENT_GROUP_NAME_LENGTH,
  MAX_ORDER_VALUE,
  maxLengthError,
} from '../../../shared/utils/formValidation';
import { FormSelect } from '../../../shared/components/FormSelect';
import SortableTableWithAdd, { type SortableTableRow } from '../../../shared/components/SortableTableWithAdd';
import type { FormSelectOption } from '../../../shared/components/FormSelect';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';

export type StaticDepartmentGroupFormData = {
  name: string;
  order: string;
  product_id: string;
  departments: SortableTableRow[];
};

export interface StaticDepartmentGroupFormRef {
  getData: () => StaticDepartmentGroupFormData;
  validate: () => boolean;
}

export interface StaticDepartmentGroupFormProps {
  initialData?: Partial<StaticDepartmentGroupFormData>;
  productOptions?: FormSelectOption[];
  departmentOptions?: FormSelectOption[];
  onSubmit?: (data: StaticDepartmentGroupFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
}

const emptyForm: StaticDepartmentGroupFormData = {
  name: '',
  order: '',
  product_id: '',
  departments: [],
};

const StaticDepartmentGroupFormInner = forwardRef<
  StaticDepartmentGroupFormRef,
  StaticDepartmentGroupFormProps
>(function StaticDepartmentGroupFormInner(
  {
    initialData,
    productOptions = [],
    departmentOptions = [],
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
  const [formData, setFormData] = useState<StaticDepartmentGroupFormData>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useImperativeHandle(ref, () => ({
    getData: () => ({ ...formData }),
    validate: () => validate(),
  }));

  const lastAppliedInitialRef = useRef<Partial<StaticDepartmentGroupFormData> | undefined>(undefined);
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

  const handleChange = (key: keyof StaticDepartmentGroupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleDepartmentsChange = (departments: SortableTableRow[]) => {
    setFormData((prev) => ({ ...prev, departments }));
    if (errors.departments) setErrors((prev) => ({ ...prev, departments: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const name = formData.name.trim();
    if (!name) next.name = 'Department group name is required';
    else if (name.length > MAX_DEPARTMENT_GROUP_NAME_LENGTH)
      next.name = maxLengthError('Department group name', MAX_DEPARTMENT_GROUP_NAME_LENGTH);
    const orderVal = formData.order.trim();
    if (orderVal !== '') {
      const num = parseInt(orderVal, 10);
      if (!Number.isInteger(num) || num < 0 || num > MAX_ORDER_VALUE)
        next.order = `Order must be between 0 and ${MAX_ORDER_VALUE}`;
    }
    if (!formData.product_id.trim()) next.product_id = 'Product is required';
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
  const readOnlyFieldClass = `min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm ${
    isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
  }`;

  const sanitizeOrderInput = (v: string): string => {
    const digits = v.replace(/[^\d]/g, '');
    if (digits === '') return '';
    const num = parseInt(digits, 10);
    if (num > MAX_ORDER_VALUE) return String(MAX_ORDER_VALUE);
    return digits;
  };

  const fields = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>
            Department Group Name <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
          </label>
          {readOnly ? (
            <div className={readOnlyFieldClass}>
              {formData.name || '–'}
            </div>
          ) : (
            <>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter department group name"
                maxLength={MAX_DEPARTMENT_GROUP_NAME_LENGTH}
                className={inputClass('name')}
              />
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Max {MAX_DEPARTMENT_GROUP_NAME_LENGTH} characters
              </p>
            </>
          )}
          {errors.name && <p className={`mt-1 ${errorClass}`}>{errors.name}</p>}
        </div>
        <div>
          <label className={labelClass}>Order</label>
          {readOnly ? (
            <div className={readOnlyFieldClass}>
              {formData.order || '0'}
            </div>
          ) : (
            <>
              <input
                type="text"
                inputMode="numeric"
                value={formData.order}
                onChange={(e) => handleChange('order', sanitizeOrderInput(e.target.value))}
                placeholder="e.g. 1, 2, 43"
                maxLength={3}
                className={inputClass('order')}
              />
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Max {MAX_ORDER_VALUE} (0-99)
              </p>
            </>
          )}
          {errors.order && <p className={`mt-1 ${errorClass}`}>{errors.order}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Product <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
        </label>
        {readOnly ? (() => {
          const displayLabel = productOptions.find((o) => o.value === formData.product_id)?.label ?? formData.product_id;
          const route = formData.product_id ? getEntityDetailRoute('product_id', formData.product_id) : null;
          return route ? (
            <div className={readOnlyFieldClass}>
              <Link to={route} className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}>{displayLabel || '–'}</Link>
            </div>
          ) : (
            <div className={readOnlyFieldClass}>{displayLabel || '–'}</div>
          );
        })() : (
          <FormSelect
            value={formData.product_id}
            onChange={(v) => handleChange('product_id', v)}
            options={productOptions}
            placeholder="Select product"
            className={inputClass('product_id')}
            isDarkMode={isDarkMode}
          />
        )}
        {errors.product_id && <p className={`mt-1 ${errorClass}`}>{errors.product_id}</p>}
      </div>

      <section className={`mt-8 pt-6  ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <SortableTableWithAdd
          rows={formData.departments}
          onChange={handleDepartmentsChange}
          departmentOptions={departmentOptions}
          addButtonLabel="Add Department"
          readOnly={readOnly}
          title="Department"
        />
      </section>
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
          {submitLoading ? 'Saving...' : isEdit ? 'Update Department Group' : 'Create Department Group'}
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

export default StaticDepartmentGroupFormInner;
