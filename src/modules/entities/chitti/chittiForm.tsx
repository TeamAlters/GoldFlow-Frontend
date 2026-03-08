/**
 * Chitti form: customer, transaction_type, purity, material_issues (linked issues multi-select).
 * UI only; options and callbacks from parent (parent does API).
 */

import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { FormSelect } from '../../../shared/components/FormSelect';

export type ChittiFormData = {
  customer: string;
  transaction_type: 'Labour' | 'Purchase';
  purity: string;
  material_issues: string[];
};

export interface ChittiFormRef {
  getData: () => ChittiFormData;
  validate: () => boolean;
}

export type ChittiFormOption = { value: string; label: string };

export interface ChittiFormProps {
  initialData?: Partial<ChittiFormData>;
  customerOptions: ChittiFormOption[];
  purityOptions: ChittiFormOption[];
  availableIssuesOptions: ChittiFormOption[];
  /** When provided, called when customer, purity, or transaction_type change so parent can refetch available issues */
  onFilterChange?: (params: { customer: string; purity: string; transaction_type: 'Labour' | 'Purchase' }) => void;
  /** When false, hide the linked issues (material issues) field - e.g. on view page where a table is shown instead */
  showMaterialIssuesField?: boolean;
  onSubmit?: (data: ChittiFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
}

const TRANSACTION_TYPE_OPTIONS: ChittiFormOption[] = [
  { value: 'Labour', label: 'Labour' },
  { value: 'Purchase', label: 'Purchase' },
];

const emptyForm: ChittiFormData = {
  customer: '',
  transaction_type: 'Labour',
  purity: '',
  material_issues: [],
};

const ChittiFormInner = forwardRef<ChittiFormRef, ChittiFormProps>(
  function ChittiFormInner(
    {
      initialData,
      customerOptions,
      purityOptions,
      availableIssuesOptions,
      onFilterChange,
      showMaterialIssuesField = true,
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
    const [formData, setFormData] = useState<ChittiFormData>({ ...emptyForm });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getData: () => ({ ...formData }),
      validate: () => validate(),
    }));

    useEffect(() => {
      if (initialData) {
        setFormData((prev) => ({ ...emptyForm, ...prev, ...initialData }));
      }
    }, [initialData]);

    const handleChange = (key: keyof ChittiFormData, value: string | string[]) => {
      setFormData((prev) => {
        const next = { ...prev, [key]: value };
        if (key === 'customer' || key === 'purity' || key === 'transaction_type') {
          onFilterChange?.({
            customer: key === 'customer' ? (value as string) : prev.customer,
            purity: key === 'purity' ? (value as string) : prev.purity,
            transaction_type: key === 'transaction_type' ? (value as 'Labour' | 'Purchase') : prev.transaction_type,
          });
        }
        return next;
      });
      if (errors[key as string]) setErrors((prev) => ({ ...prev, [key as string]: '' }));
    };

    const validate = (): boolean => {
      const next: Record<string, string> = {};
      if (!formData.customer.trim()) next.customer = 'Customer is required';
      if (!formData.purity.trim()) next.purity = 'Purity is required';
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

    const addIssue = (voucherNo: string) => {
      if (formData.material_issues.includes(voucherNo)) return;
      handleChange('material_issues', [...formData.material_issues, voucherNo]);
    };

    const removeIssue = (voucherNo: string) => {
      handleChange(
        'material_issues',
        formData.material_issues.filter((v) => v !== voucherNo)
      );
    };

    const remainingOptions = availableIssuesOptions.filter(
      (o) => !formData.material_issues.includes(o.value)
    );

    const fields = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>
            Customer <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
          </label>
          {readOnly ? (
            <div className={inputClass('customer')}>
              {formData.customer
                ? customerOptions.find((o) => o.value === formData.customer)?.label ?? formData.customer
                : '–'}
            </div>
          ) : (
            <FormSelect
              value={formData.customer}
              onChange={(v) => handleChange('customer', v)}
              options={customerOptions}
              placeholder="Select customer"
              disabled={readOnly}
              className={inputClass('customer')}
              isDarkMode={isDarkMode}
            />
          )}
          {errors.customer && <p className={`mt-1 ${errorClass}`}>{errors.customer}</p>}
        </div>

        <div>
          <label className={labelClass}>Transaction type</label>
          {readOnly ? (
            <div className={inputClass('transaction_type')}>{formData.transaction_type}</div>
          ) : (
            <FormSelect
              value={formData.transaction_type}
              onChange={(v) => handleChange('transaction_type', v as 'Labour' | 'Purchase')}
              options={TRANSACTION_TYPE_OPTIONS}
              placeholder="Select type"
              disabled={readOnly}
              className={inputClass('transaction_type')}
              isDarkMode={isDarkMode}
            />
          )}
        </div>

        <div>
          <label className={labelClass}>
            Purity <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
          </label>
          {readOnly ? (
            <div className={inputClass('purity')}>
              {formData.purity
                ? purityOptions.find((o) => o.value === formData.purity)?.label ?? formData.purity
                : '–'}
            </div>
          ) : (
            <FormSelect
              value={formData.purity}
              onChange={(v) => handleChange('purity', v)}
              options={purityOptions}
              placeholder="Select purity"
              disabled={readOnly}
              className={inputClass('purity')}
              isDarkMode={isDarkMode}
            />
          )}
          {errors.purity && <p className={`mt-1 ${errorClass}`}>{errors.purity}</p>}
        </div>

        {showMaterialIssuesField && (
        <div className="md:col-span-2">
          <label className={labelClass}>Linked issues (material issues)</label>
          {readOnly ? (
            <div className={`flex flex-wrap gap-2 ${inputClass('material_issues')}`}>
              {formData.material_issues.length === 0
                ? '–'
                : formData.material_issues.map((v) => (
                    <span
                      key={v}
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {v}
                    </span>
                  ))}
            </div>
          ) : (
            <div ref={containerRef} className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {formData.material_issues.map((v) => (
                  <span
                    key={v}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                      isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {v}
                    <button
                      type="button"
                      onClick={() => removeIssue(v)}
                      className="ml-1 rounded hover:opacity-80 focus:outline-none"
                      aria-label={`Remove ${v}`}
                    >
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>×</span>
                    </button>
                  </span>
                ))}
              </div>
              {remainingOptions.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) addIssue(v);
                    e.target.value = '';
                  }}
                  className={inputClass('material_issues')}
                  aria-label="Add linked issue"
                >
                  <option value="">Add issue...</option>
                  {remainingOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
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
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLoading}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
              isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-60`}
          >
            {submitLoading ? 'Saving...' : isEdit ? 'Update Chitti' : 'Create Chitti'}
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

export default ChittiFormInner;
