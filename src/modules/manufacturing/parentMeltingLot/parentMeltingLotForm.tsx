import { useState, useEffect } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { MAX_TEXT_FIELD_LENGTH } from '../../../shared/utils/formValidation';
import { FormSelect } from '../../../shared/components/FormSelect';

export interface ParentMeltingLotFormData {
  name: string;
  product: string;
  product_abbreviation: string;
  purity: string;
}

export interface ParentMeltingLotFormProps {
  initialData?: Partial<ParentMeltingLotFormData>;
  onSubmit: (data: ParentMeltingLotFormData) => void;
  isLoading?: boolean;
  productOptions: Array<{ value: string; label: string }>;
  purityOptions: Array<{ value: string; label: string }>;
}

export default function ParentMeltingLotForm({
  initialData,
  onSubmit,
  isLoading = false,
  productOptions,
  purityOptions,
}: ParentMeltingLotFormProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const [formData, setFormData] = useState<ParentMeltingLotFormData>({
    name: initialData?.name ?? '',
    product: initialData?.product ?? '',
    product_abbreviation: initialData?.product_abbreviation ?? '',
    purity: initialData?.purity ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Auto-fill product abbreviation when product changes
    if (formData.product) {
      const selectedProduct = productOptions.find((p) => p.value === formData.product);
      if (selectedProduct) {
        // Extract abbreviation from product name (first 3 letters typically)
        const abbrev = selectedProduct.label.substring(0, 3).toUpperCase();
        if (formData.product_abbreviation !== abbrev) {
          setFormData((prev) => ({ ...prev, product_abbreviation: abbrev }));
        }
      }
    }
  }, [formData.product, productOptions]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > MAX_TEXT_FIELD_LENGTH) {
      newErrors.name = `Name must be at most ${MAX_TEXT_FIELD_LENGTH} characters`;
    }

    if (!formData.product) {
      newErrors.product = 'Product is required';
    }

    if (!formData.product_abbreviation.trim()) {
      newErrors.product_abbreviation = 'Product Abbreviation is required';
    } else if (formData.product_abbreviation.length > MAX_TEXT_FIELD_LENGTH) {
      newErrors.product_abbreviation = `Product Abbreviation must be at most ${MAX_TEXT_FIELD_LENGTH} characters`;
    }

    if (!formData.purity) {
      newErrors.purity = 'Purity is required';
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

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
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

  const errorClass = `text-xs mt-1 ${
    isDarkMode ? 'text-red-400' : 'text-red-600'
  }`;

  return (
    <form id="parent-melting-lot-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className={labelClass}>
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => handleChange(e.target.name, e.target.value)}
            maxLength={MAX_TEXT_FIELD_LENGTH}
            disabled={!!initialData?.name} // Name is PK, cannot be edited
            className={`${inputClass} ${errors.name ? 'border-red-500' : ''} ${
              initialData?.name ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="Enter name"
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>

        {/* Product */}
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
            className={`${errors.product ? 'border-red-500' : ''} ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-gray-200'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          {errors.product && <p className={errorClass}>{errors.product}</p>}
        </div>

        {/* Product Abbreviation */}
        <div>
          <label htmlFor="product_abbreviation" className={labelClass}>
            Product Abbreviation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="product_abbreviation"
            name="product_abbreviation"
            value={formData.product_abbreviation}
            onChange={(e) => handleChange(e.target.name, e.target.value)}
            maxLength={MAX_TEXT_FIELD_LENGTH}
            className={`${inputClass} ${errors.product_abbreviation ? 'border-red-500' : ''}`}
            placeholder="Enter product abbreviation"
          />
          {errors.product_abbreviation && <p className={errorClass}>{errors.product_abbreviation}</p>}
        </div>

        {/* Purity */}
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
            className={`${errors.purity ? 'border-red-500' : ''} ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-gray-200'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          {errors.purity && <p className={errorClass}>{errors.purity}</p>}
        </div>
      </div>

      {/* Submit Button - removed from form, handled by parent */}
    </form>
  );
}
