import { useState, useEffect } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { FormSelect } from '../../../shared/components/FormSelect';
import type { FormSelectOption } from '../../../shared/components/FormSelect';

export interface JobCardFormData {
  product: string;
  parent_melting_lot: string;
  melting_lot: string;
  purity: string;
  department: string;
  department_group: string;
  design: string;
  previous_job_card: string;
  qty: string;
}

export interface JobCardFormProps {
  initialData?: Partial<JobCardFormData>;
  onSubmit: (data: JobCardFormData) => void;
  isLoading?: boolean;
  isEdit?: boolean;
  productOptions: FormSelectOption[];
  parentMeltingLotOptions: FormSelectOption[];
  meltingLotOptions: FormSelectOption[];
  purityOptions: FormSelectOption[];
  departmentOptions: FormSelectOption[];
  departmentGroupOptions: FormSelectOption[];
  designOptions: FormSelectOption[];
  previousJobCardOptions: FormSelectOption[];
}

function validateInteger(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = parseInt(trimmed, 10);
  if (!Number.isFinite(n) || String(n) !== trimmed) {
    return `${fieldLabel} must be a whole number`;
  }
  if (n < 0) {
    return `${fieldLabel} must be zero or greater`;
  }
  return null;
}

export default function JobCardForm({
  initialData,
  onSubmit,
  isLoading = false,
  isEdit = false,
  productOptions,
  parentMeltingLotOptions,
  meltingLotOptions,
  purityOptions,
  departmentOptions,
  departmentGroupOptions,
  designOptions,
  previousJobCardOptions,
}: JobCardFormProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const [formData, setFormData] = useState<JobCardFormData>({
    product: initialData?.product ?? '',
    parent_melting_lot: initialData?.parent_melting_lot ?? '',
    melting_lot: initialData?.melting_lot ?? '',
    purity: initialData?.purity ?? '',
    department: initialData?.department ?? '',
    department_group: initialData?.department_group ?? '',
    design: initialData?.design ?? '',
    previous_job_card: initialData?.previous_job_card ?? '',
    qty: initialData?.qty ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product) {
      newErrors.product = 'Product is required';
    }

    if (!formData.melting_lot) {
      newErrors.melting_lot = 'Melting lot is required';
    }

    if (!formData.purity) {
      newErrors.purity = 'Purity is required';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.department_group) {
      newErrors.department_group = 'Department group is required';
    }

    if (!formData.design) {
      newErrors.design = 'Design is required';
    }

    const qtyError = validateInteger(formData.qty, 'Qty');
    if (qtyError) {
      newErrors.qty = qtyError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (name: keyof JobCardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  }`;

  const labelClass = `block text-sm font-semibold mb-1.5 ${
    isDarkMode ? 'text-gray-300' : 'text-gray-700'
  }`;

  const errorClass = `text-xs mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`;

  const selectClass = (key: string) =>
    `${errors[key] ? 'border-red-500' : ''} ${
      isDarkMode
        ? 'bg-gray-700 border-gray-600 text-gray-200'
        : 'bg-white border-gray-300 text-gray-900'
    }`;

  return (
    <form id="job-card-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label htmlFor="product" className={labelClass}>
            Product <span className="text-red-500">*</span>
          </label>
          <FormSelect
            value={formData.product}
            onChange={(value) => handleChange('product', value)}
            options={productOptions}
            placeholder="Select Product"
            isDarkMode={isDarkMode}
            className={selectClass('product')}
          />
          {errors.product && <p className={errorClass}>{errors.product}</p>}
        </div>

        <div>
          <label htmlFor="parent_melting_lot" className={labelClass}>
            Parent Melting Lot
          </label>
          <FormSelect
            value={formData.parent_melting_lot}
            onChange={(value) => handleChange('parent_melting_lot', value)}
            options={parentMeltingLotOptions}
            placeholder="Select Parent Melting Lot"
            isDarkMode={isDarkMode}
            className={selectClass('parent_melting_lot')}
          />
          {errors.parent_melting_lot && (
            <p className={errorClass}>{errors.parent_melting_lot}</p>
          )}
        </div>

        <div>
          <label htmlFor="melting_lot" className={labelClass}>
            Melting Lot <span className="text-red-500">*</span>
          </label>
          <FormSelect
            value={formData.melting_lot}
            onChange={(value) => handleChange('melting_lot', value)}
            options={meltingLotOptions}
            placeholder="Select Melting Lot"
            isDarkMode={isDarkMode}
            className={selectClass('melting_lot')}
          />
          {errors.melting_lot && <p className={errorClass}>{errors.melting_lot}</p>}
        </div>

        <div>
          <label htmlFor="purity" className={labelClass}>
            Purity <span className="text-red-500">*</span>
          </label>
          <FormSelect
            value={formData.purity}
            onChange={(value) => handleChange('purity', value)}
            options={purityOptions}
            placeholder="Select Purity"
            isDarkMode={isDarkMode}
            className={selectClass('purity')}
          />
          {errors.purity && <p className={errorClass}>{errors.purity}</p>}
        </div>

        <div>
          <label htmlFor="department" className={labelClass}>
            Department <span className="text-red-500">*</span>
          </label>
          <FormSelect
            value={formData.department}
            onChange={(value) => handleChange('department', value)}
            options={departmentOptions}
            placeholder="Select Department"
            isDarkMode={isDarkMode}
            className={selectClass('department')}
          />
          {errors.department && <p className={errorClass}>{errors.department}</p>}
        </div>

        <div>
          <label htmlFor="department_group" className={labelClass}>
            Department Group <span className="text-red-500">*</span>
          </label>
          <FormSelect
            value={formData.department_group}
            onChange={(value) => handleChange('department_group', value)}
            options={departmentGroupOptions}
            placeholder="Select Department Group"
            isDarkMode={isDarkMode}
            className={selectClass('department_group')}
          />
          {errors.department_group && (
            <p className={errorClass}>{errors.department_group}</p>
          )}
        </div>

        <div>
          <label htmlFor="design" className={labelClass}>
            Design <span className="text-red-500">*</span>
          </label>
          <FormSelect
            value={formData.design}
            onChange={(value) => handleChange('design', value)}
            options={designOptions}
            placeholder="Select Design"
            isDarkMode={isDarkMode}
            className={selectClass('design')}
          />
          {errors.design && <p className={errorClass}>{errors.design}</p>}
        </div>

        <div>
          <label htmlFor="previous_job_card" className={labelClass}>
            Previous Job Card
          </label>
          <FormSelect
            value={formData.previous_job_card}
            onChange={(value) => handleChange('previous_job_card', value)}
            options={previousJobCardOptions}
            placeholder="Select Previous Job Card"
            isDarkMode={isDarkMode}
            className={selectClass('previous_job_card')}
          />
          {errors.previous_job_card && (
            <p className={errorClass}>{errors.previous_job_card}</p>
          )}
        </div>

        <div>
          <label htmlFor="qty" className={labelClass}>
            Qty
          </label>
          <input
            type="text"
            id="qty"
            name="qty"
            value={formData.qty}
            onChange={(e) => handleChange('qty', e.target.value)}
            className={`${inputClass} ${errors.qty ? 'border-red-500' : ''}`}
            placeholder="Enter quantity"
          />
          {errors.qty && <p className={errorClass}>{errors.qty}</p>}
        </div>
      </div>
    </form>
  );
}
