import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { MAX_LENGTH_36, maxLengthError } from '../../../shared/utils/formValidation';

export type StaticItemFormData = {
  item_name: string;
  item_type: string;
};

export interface StaticItemFormRef {
  getData: () => StaticItemFormData;
  validate: () => boolean;
}

export interface ItemTypeOption {
  value: string;
  label: string;
}

export interface StaticItemFormProps {
  initialData?: Partial<StaticItemFormData>;
  itemTypeOptions?: ItemTypeOption[];
  onSubmit?: (data: StaticItemFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
}

const emptyForm: StaticItemFormData = {
  item_name: '',
  item_type: '',
};

const StaticItemFormInner = forwardRef<StaticItemFormRef, StaticItemFormProps>(
  function StaticItemFormInner(
    {
      initialData,
      itemTypeOptions = [],
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
    const [formData, setFormData] = useState<StaticItemFormData>({ ...emptyForm });
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

    const handleChange = (key: keyof StaticItemFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
    };

    const validate = (): boolean => {
      const next: Record<string, string> = {};
      const name = formData.item_name.trim();
      if (!name) next.item_name = 'Item name is required';
      else if (name.length > MAX_LENGTH_36)
        next.item_name = maxLengthError('Item name', MAX_LENGTH_36);
      if (!formData.item_type.trim()) next.item_type = 'Item type is required';
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
            Item Name <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
          </label>
          <input
            type="text"
            value={formData.item_name}
            onChange={(e) => handleChange('item_name', e.target.value)}
            placeholder="e.g. Item-01"
            maxLength={MAX_LENGTH_36}
            className={inputClass('item_name')}
            disabled={readOnly}
            readOnly={readOnly}
          />
          {errors.item_name && (
            <p className={`mt-1 ${errorClass}`}>{errors.item_name}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>
            Item Type <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
          </label>
          {itemTypeOptions.length > 0 ? (
            <select
              value={formData.item_type}
              onChange={(e) => handleChange('item_type', e.target.value)}
              className={inputClass('item_type')}
              disabled={readOnly}
            >
              <option value="">Select item type</option>
              {itemTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formData.item_type}
              onChange={(e) => handleChange('item_type', e.target.value)}
              placeholder="Item type"
              maxLength={MAX_LENGTH_36}
              className={inputClass('item_type')}
              disabled={readOnly}
              readOnly={readOnly}
            />
          )}
          {errors.item_type && (
            <p className={`mt-1 ${errorClass}`}>{errors.item_type}</p>
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
            {submitLoading ? 'Saving...' : isEdit ? 'Update Item Name' : 'Create Item Name'}
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

export default StaticItemFormInner;
