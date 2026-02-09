import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';

export type StaticPurityFormData = {
    purity: string;
    purity_percentage: string;
};

export interface StaticPurityFormRef {
    getData: () => StaticPurityFormData;
    validate: () => boolean;
}

export interface StaticPurityFormProps {
    initialData?: Partial<StaticPurityFormData>;
    onSubmit?: (data: StaticPurityFormData) => void;
    onCancel?: () => void;
    isEdit?: boolean;
    readOnly?: boolean;
    submitLoading?: boolean;
    wrapInForm?: boolean;
    showActions?: boolean;
}

const emptyForm: StaticPurityFormData = {
    purity: '',
    purity_percentage: '',
};

const StaticPurityFormInner = forwardRef<StaticPurityFormRef, StaticPurityFormProps>(
    function StaticPurityFormInner(
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
        const [formData, setFormData] = useState<StaticPurityFormData>({ ...emptyForm });
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

        const handleChange = (key: keyof StaticPurityFormData, value: string) => {
            setFormData((prev) => ({ ...prev, [key]: value }));
            if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
        };

        const validate = (): boolean => {
            const next: Record<string, string> = {};
            if (!formData.purity.trim()) next.purity = 'Purity is required';
            const pct = formData.purity_percentage.trim();
            if (!pct) next.purity_percentage = 'Purity percentage is required';
            else {
                const num = parseFloat(pct);
                if (Number.isNaN(num)) next.purity_percentage = 'Enter a valid number';
                else if (num < 0 || num > 100) next.purity_percentage = 'Must be between 0 and 100';
            }
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
                        Purity <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.purity}
                        onChange={(e) => handleChange('purity', e.target.value)}
                        placeholder="e.g. 24K, 22K"
                        className={inputClass('purity')}
                        disabled={isEdit || readOnly}
                        readOnly={readOnly}
                    />
                    {errors.purity && <p className={`mt-1 ${errorClass}`}>{errors.purity}</p>}
                </div>
                <div>
                    <label className={labelClass}>
                        Purity % <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
                    </label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={formData.purity_percentage}
                        onChange={(e) => handleChange('purity_percentage', e.target.value)}
                        placeholder="e.g. 99.99"
                        className={inputClass('purity_percentage')}
                        disabled={readOnly}
                        readOnly={readOnly}
                    />
                    {errors.purity_percentage && (
                        <p className={`mt-1 ${errorClass}`}>{errors.purity_percentage}</p>
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
                        {submitLoading ? 'Saving...' : isEdit ? 'Update Purity' : 'Create Purity'}
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

export default StaticPurityFormInner;
