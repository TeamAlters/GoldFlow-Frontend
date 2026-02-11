import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { MAX_TEXT_FIELD_LENGTH, maxLengthError } from '../../../shared/utils/formValidation';

export type StaticProductFormData = {
    product_name: string;
    product_abbrevation: string;
};

export interface StaticProductFormRef {
    getData: () => StaticProductFormData;
    validate: () => boolean;
}

export interface StaticProductFormProps {
    initialData?: Partial<StaticProductFormData>;
    onSubmit?: (data: StaticProductFormData) => void;
    onCancel?: () => void;
    isEdit?: boolean;
    readOnly?: boolean;
    submitLoading?: boolean;
    wrapInForm?: boolean;
    showActions?: boolean;
}

const emptyForm: StaticProductFormData = {
    product_name: '',
    product_abbrevation: '',
};

const StaticProductFormInner = forwardRef<StaticProductFormRef, StaticProductFormProps>(
    function StaticProductFormInner(
        {
            initialData,
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
        const [formData, setFormData] = useState<StaticProductFormData>({ ...emptyForm });
        const [errors, setErrors] = useState<Record<string, string>>({});

        useImperativeHandle(ref, () => ({
            getData: () => ({ ...formData }),
            validate: () => validate(),
        }));

        const lastAppliedInitialRef = useRef<Partial<StaticProductFormData> | undefined>(undefined);
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

        const handleChange = (key: keyof StaticProductFormData, value: string) => {
            setFormData((prev) => ({ ...prev, [key]: value }));
            if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
        };

        const validate = (): boolean => {
            const next: Record<string, string> = {};
            const name = formData.product_name.trim();
            if (!name) next.product_name = 'Product name is required';
            else if (name.length > MAX_TEXT_FIELD_LENGTH)
                next.product_name = maxLengthError('Product name');
            const abbr = formData.product_abbrevation.trim();
            if (!abbr) next.product_abbrevation = 'Product abbreviation is required';
            else if (abbr.length > MAX_TEXT_FIELD_LENGTH)
                next.product_abbrevation = maxLengthError('Product abbreviation');
            setErrors(next);
            return Object.keys(next).length === 0;
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (validate() && onSubmit) onSubmit(formData);
        };

        const inputClass = (key: string) =>
            `w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${errors[key]
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
                        Product Name <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.product_name}
                        onChange={(e) => handleChange('product_name', e.target.value)}
                        placeholder="Enter product name"
                        maxLength={MAX_TEXT_FIELD_LENGTH}
                        className={inputClass('product_name')}
                        disabled={readOnly}
                        readOnly={readOnly}
                    />
                    {errors.product_name && (
                        <p className={`mt-1 ${errorClass}`}>{errors.product_name}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>
                        Product Abbreviation <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.product_abbrevation}
                        onChange={(e) => handleChange('product_abbrevation', e.target.value)}
                        placeholder="e.g. GR, RC"
                        maxLength={MAX_TEXT_FIELD_LENGTH}
                        className={inputClass('product_abbrevation')}
                        disabled={readOnly}
                        readOnly={readOnly}
                    />
                    {errors.product_abbrevation && (
                        <p className={`mt-1 ${errorClass}`}>{errors.product_abbrevation}</p>
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
                        className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitLoading}
                        className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } disabled:opacity-60`}
                    > 
                        {submitLoading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
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
    }
);

export default StaticProductFormInner;
