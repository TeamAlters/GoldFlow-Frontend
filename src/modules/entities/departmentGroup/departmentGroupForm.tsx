import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../../../stores/ui.store';
import {
  MAX_DEPARTMENT_GROUP_NAME_LENGTH,
  MAX_STEP_NO_VALUE,
  validateTextMaxLength,
  validateIntegerInRange,
  getTextInputDescription,
  getIntegerInputDescription,
} from '../../../shared/utils/formValidation';
import { FormSelect } from '../../../shared/components/FormSelect';
import { FormFieldHint } from '../../../shared/components/FormFieldHint';
import SortableTableWithAdd, { type SortableTableRow } from '../../../shared/components/SortableTableWithAdd';
import type { FormSelectOption } from '../../../shared/components/FormSelect';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';
import ProductDepartmentConfigModalContent from '../productDepartment/ProductDepartmentConfigModalContent';
import ProductDepartmentConfigModalContentFromData from '../productDepartment/ProductDepartmentConfigModalContentFromData';
import { toInitialProductDepartmentData } from '../productDepartment/productDepartmentCreate';

export type StaticDepartmentGroupFormData = {
  name: string;
  order: string;
  product_id: string;
  is_active: boolean;
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
  /** Raw department config objects from department group GET API; used to show Configurations modal without extra API call */
  departmentsConfig?: Record<string, unknown>[];
  /** When provided (e.g. on edit), used to resolve product_department id via lookup when config has no id */
  departmentGroupId?: string;
  /** Called after saving a department configuration in the modal; use to refetch department group data */
  onConfigSaved?: () => void;
}

const emptyForm: StaticDepartmentGroupFormData = {
  name: '',
  order: '',
  product_id: '',
  is_active: true,
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
    departmentsConfig,
    departmentGroupId,
    onConfigSaved,
  },
  ref
) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const [formData, setFormData] = useState<StaticDepartmentGroupFormData>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useImperativeHandle(
    ref,
    () => ({
      getData: () => ({ ...formData }),
      validate: () => validate(),
    }),
    [formData]
  );

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

  const handleActiveChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
  };

  const handleDepartmentsChange = (departments: SortableTableRow[]) => {
    setFormData((prev) => ({ ...prev, departments }));
    if (errors.departments) setErrors((prev) => ({ ...prev, departments: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const name = formData.name.trim();
    if (!name) next.name = 'Department group name is required';
    else {
      const err = validateTextMaxLength(name, 'Department group name', MAX_DEPARTMENT_GROUP_NAME_LENGTH);
      if (err) next.name = err;
    }
    const orderVal = formData.order.trim();
    if (orderVal !== '') {
      const err = validateIntegerInRange(orderVal, 'Step No', 0, MAX_STEP_NO_VALUE);
      if (err) next.order = err;
    }
    if (!formData.product_id.trim()) next.product_id = 'Product is required';
    if (formData.departments.length === 0) {
      next.departments = 'Add at least one department and select it.';
    } else {
      const hasEmptyDepartment = formData.departments.some(
        (r) => (r.department_id ?? '').trim() === ''
      );
      if (hasEmptyDepartment) {
        next.departments = 'Department is required for each row. Please select a department for all rows.';
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
    if (num > MAX_STEP_NO_VALUE) return String(MAX_STEP_NO_VALUE);
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
              <FormFieldHint>{getTextInputDescription(MAX_DEPARTMENT_GROUP_NAME_LENGTH)}</FormFieldHint>
            </>
          )}
          {errors.name && <p className={`mt-1 ${errorClass}`}>{errors.name}</p>}
        </div>
        <div>
          <label className={labelClass}>Step No</label>
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
              <FormFieldHint>{getIntegerInputDescription(0, MAX_STEP_NO_VALUE)}</FormFieldHint>
            </>
          )}
          {errors.order && <p className={`mt-1 ${errorClass}`}>{errors.order}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div>
          <label className={labelClass}>Active</label>
          {readOnly ? (
            <div className={readOnlyFieldClass}>
              {formData.is_active ? 'Yes' : 'No'}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="department-group-is-active"
                checked={formData.is_active}
                onChange={(e) => handleActiveChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-700 dark:checked:bg-blue-600"
                aria-label="Active"
              />
              <label htmlFor="department-group-is-active" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Department group is active
              </label>
            </div>
          )}
        </div>
      </div>

      <section className={`mt-8 pt-6  ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <SortableTableWithAdd
          rows={formData.departments}
          onChange={handleDepartmentsChange}
          departmentOptions={departmentOptions}
          addButtonLabel="Add Department"
          readOnly={readOnly}
          title="Department"
          getRowError={
            errors.departments
              ? (row) => ((row.department_id ?? '').trim() === '' ? 'Department is required.' : undefined)
              : undefined
          }
          renderViewContent={(row, onCloseModal) => {
            const productDepartmentId = row.product_department_id ?? (row.id.startsWith('row-') ? undefined : row.id);
            if (productDepartmentId) {
              return (
                <ProductDepartmentConfigModalContent
                  productDepartmentId={productDepartmentId}
                  onClose={onCloseModal}
                  onSaved={onConfigSaved}
                />
              );
            }
            if (departmentsConfig && departmentsConfig.length > 0 && row.department_id) {
              const match = departmentsConfig.find(
                (item) =>
                  String(item.department ?? item.department_name ?? '') === String(row.department_id)
              );
              if (match) {
                const matchName = match.name != null ? String(match.name) : '';
                const configInitialData = toInitialProductDepartmentData(match);
                return (
                  <ProductDepartmentConfigModalContentFromData
                    initialData={configInitialData}
                    productDepartmentName={matchName}
                    readOnly={readOnly}
                    departmentGroupIdOrName={departmentGroupId ?? formData.name ?? ''}
                    productId={formData.product_id}
                    departmentId={row.department_id}
                    onClose={onCloseModal}
                    onSaved={onConfigSaved}
                    productOptions={productOptions}
                    departmentOptions={departmentOptions}
                  />
                );
              }
            }
            return (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Save the department group first to edit configurations for this department.
              </p>
            );
          }}
          getViewModalTitle={(row) => {
            const deptLabel = departmentOptions.find((o) => o.value === row.department_id)?.label ?? row.department_id ?? 'Department';
            return `Configurations: ${deptLabel}`;
          }}
        />
        {errors.departments && formData.departments.length === 0 && (
          <p className={`mt-2 ${errorClass}`}>{errors.departments}</p>
        )}
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
