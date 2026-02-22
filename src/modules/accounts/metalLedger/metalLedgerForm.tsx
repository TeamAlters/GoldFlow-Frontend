import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import {
  MAX_TEXT_FIELD_LENGTH,
  MAX_VOUCHER_NO_LENGTH,
  MAX_ITEM_NAME_LENGTH,
  MAX_NUMERIC_184_LENGTH,
  MAX_NUMERIC_63_LENGTH,
  maxLengthError,
  validateNumeric63,
  validateNumeric184,
  sanitizeNumeric63Input,
  sanitizeNumeric184Input,
} from '../../../shared/utils/formValidation';
import type { ReferenceOption } from '../../admin/admin.api';
import { getEntityReferences, mapReferenceItemsToOptions } from '../../admin/admin.api';

export type MetalLedgerFormData = {
  // Ledger Info
  voucher_no: string;
  entry_type: string;
  metal_type: string;
  transaction_type: string;
  transaction_date: string;
  customer: string;
  remarks: string;
  status: string;

  // Item
  item_name: string;

  // Purity Details
  purity: string;
  purity_percentage: string;
  total_purity: string;
  wastage: string;

  // Weight Details
  gross_weight: string;
  pure_weight: string;
  fine_weight: string;
  fine_weight_with_wastage: string;
  rate_cut_weight: string;

  // Hallmark Details
  hallmark_rate: string;
  hallmark_qty: string;
  hallmark_amount: string;

  // Stone Details
  stone_rate: string;
  stone_weight: string;
  stone_amount: string;

  // Amount Details
  gold_rate: string;
  amount: string;
  total_taxable_amount: string;
  sgst: string;
  cgst: string;
  final_amount: string;

  // Audit Trails (read-only)
  created_at: string;
  modified_at: string;
  created_by: string;
  modified_by: string;
};

export interface MetalLedgerFormRef {
  getData: () => MetalLedgerFormData;
  validate: () => boolean;
}

export interface MetalLedgerFormProps {
  initialData?: Partial<MetalLedgerFormData>;
  onSubmit?: (data: MetalLedgerFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
}

// Static dropdown options based on DDL constraints
const ENTRY_TYPE_OPTIONS = [
  { label: 'Receipt', value: 'RECEIPT' },
  { label: 'Issue', value: 'ISSUE' },
];

const METAL_TYPE_OPTIONS = [
  { label: 'Gold', value: 'GOLD' },
  { label: 'Silver', value: 'SILVER' },
  { label: 'Platinum', value: 'PLATINUM' },
];

const TRANSACTION_TYPE_OPTIONS = [
  { label: 'Labour', value: 'LABOUR' },
  { label: 'Purchase', value: 'PURCHASE' },
];

const emptyForm: MetalLedgerFormData = {
  voucher_no: '',
  entry_type: 'RECEIPT',
  metal_type: 'GOLD',
  transaction_type: 'PURCHASE',
  transaction_date: new Date().toISOString().slice(0, 10),
  customer: '',
  remarks: '',
  status: '',
  item_name: '',
  purity: '',
  purity_percentage: '',
  total_purity: '',
  wastage: '',
  gross_weight: '',
  pure_weight: '',
  fine_weight: '',
  fine_weight_with_wastage: '',
  rate_cut_weight: '',
  hallmark_rate: '',
  hallmark_qty: '',
  hallmark_amount: '',
  stone_rate: '',
  stone_weight: '',
  stone_amount: '',
  gold_rate: '',
  amount: '',
  total_taxable_amount: '',
  sgst: '',
  cgst: '',
  final_amount: '',
  created_at: '',
  modified_at: '',
  created_by: '',
  modified_by: '',
};

// Helper to parse string to number safely
function toNum(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : 0;
}

// Calculate derived fields with new formulas
function calculateDerivedFields(data: MetalLedgerFormData, transactionType: string) {
  const grossWeight = toNum(data.gross_weight);
  const purityPercentage = toNum(data.purity_percentage);
  const wastage = toNum(data.wastage);
  const rateCutWeight = toNum(data.rate_cut_weight);
  const hallmarkRate = toNum(data.hallmark_rate);
  const hallmarkQty = toNum(data.hallmark_qty);
  const stoneRate = toNum(data.stone_rate);
  const stoneWeight = toNum(data.stone_weight);
  const goldRate = toNum(data.gold_rate);

  // Total Purity = Purity(%) + Wastage(%)
  const totalPurity = purityPercentage + wastage;

  // Pure Weight = Total Purity * GrossWeight / 100
  const pureWeight = grossWeight > 0 && totalPurity > 0
    ? (totalPurity * grossWeight) / 100
    : 0;

  // Fine Weight = Gross weight * Purity (%) / 100
  const fineWeight = grossWeight > 0 && purityPercentage > 0
    ? (grossWeight * purityPercentage) / 100
    : 0;

  // Fine Weight with Wastage = (Purity(%) + wastage) * GrossWeight / 100
  const fineWeightWithWastage = grossWeight > 0 && purityPercentage > 0
    ? ((purityPercentage + wastage) * grossWeight) / 100
    : 0;

  // Hallmark amount = hallmark_rate * hallmark_qty
  const hallmarkAmount = hallmarkRate * hallmarkQty;

  // Stone amount = stone_rate * stone_weight
  const stoneAmount = stoneRate * stoneWeight;

  // Amount = PureWeight * GoldRate
  const amount = pureWeight * goldRate;

  // Total Taxable Amount = Amount + Hallmark Amount + Stone Amount
  const totalTaxableAmount = amount + hallmarkAmount + stoneAmount;

  // SGST and CGST based on transaction type
  // Labour: 2.5%, Purchase: 1.5%
  const taxRate = transactionType === 'LABOUR' ? 0.025 : 0.015;
  const sgst = totalTaxableAmount * taxRate;
  const cgst = totalTaxableAmount * taxRate;

  // Final amount = Total Taxable Amount + SGST + CGST
  const finalAmount = totalTaxableAmount + sgst + cgst;

  return {
    totalPurity: totalPurity.toFixed(4),
    pureWeight: pureWeight.toFixed(4),
    fineWeight: fineWeight.toFixed(4),
    fineWeightWithWastage: fineWeightWithWastage.toFixed(4),
    hallmarkAmount: hallmarkAmount.toFixed(4),
    stoneAmount: stoneAmount.toFixed(4),
    amount: amount.toFixed(4),
    totalTaxableAmount: totalTaxableAmount.toFixed(4),
    sgst: sgst.toFixed(4),
    cgst: cgst.toFixed(4),
    finalAmount: finalAmount.toFixed(4),
  };
}

const MetalLedgerFormInner = forwardRef<MetalLedgerFormRef, MetalLedgerFormProps>(
  function MetalLedgerFormInner(
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
    const [formData, setFormData] = useState<MetalLedgerFormData>({ ...emptyForm });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [openSelectKey, setOpenSelectKey] = useState<string | null>(null);
    const selectRef = useRef<HTMLDivElement>(null);

    // Reference data states
    const [customerOptions, setCustomerOptions] = useState<ReferenceOption[]>([]);
    const [itemOptions, setItemOptions] = useState<ReferenceOption[]>([]);
    const [purityOptions, setPurityOptions] = useState<ReferenceOption[]>([]);
    const [purityPercentageMap, setPurityPercentageMap] = useState<Record<string, number>>({});

    // Load reference data
    useEffect(() => {
      // Load customers
      getEntityReferences('customer')
        .then((items) => {
          const opts = mapReferenceItemsToOptions(items, 'customer_name', 'customer_name');
          setCustomerOptions(opts.length > 0 ? opts : items.map((row: Record<string, unknown>) => ({
            value: String(row.customer_name ?? ''),
            label: String(row.customer_name ?? ''),
          })));
        })
        .catch(() => setCustomerOptions([]));

      // Load items
      getEntityReferences('item')
        .then((items) => {
          const opts = mapReferenceItemsToOptions(items, 'item_name', 'item_name');
          setItemOptions(opts.length > 0 ? opts : items.map((row: Record<string, unknown>) => ({
            value: String(row.item_name ?? ''),
            label: String(row.item_name ?? ''),
          })));
        })
        .catch(() => setItemOptions([]));

      // Load purity with percentage
      getEntityReferences('purity')
        .then((items) => {
          // Build options and percentage map from the raw data
          const percentageMap: Record<string, number> = {};
          const opts = items.map((row: Record<string, unknown>) => {
            const purity = String(row.purity ?? '');
            const purityPercentage = Number(row.purity_percentage) || 0;
            percentageMap[purity] = purityPercentage;
            return {
              value: purity,
              label: purity,
            };
          });
          setPurityOptions(opts);
          setPurityPercentageMap(percentageMap);
        })
        .catch(() => setPurityOptions([]));
    }, []);

    // Calculate derived fields
    const derived = calculateDerivedFields(formData, formData.transaction_type);

    // Update purity percentage when purity changes
    useEffect(() => {
      if (formData.purity && purityPercentageMap[formData.purity] !== undefined) {
        setFormData((prev) => ({
          ...prev,
          purity_percentage: String(purityPercentageMap[formData.purity]),
        }));
      }
    }, [formData.purity, purityPercentageMap]);

    useImperativeHandle(ref, () => ({
      getData: () => {
        const payload: MetalLedgerFormData = {
          entry_type: formData.entry_type,
          metal_type: formData.metal_type,
          transaction_type: formData.transaction_type,
          customer: formData.customer,
          item_name: formData.item_name,
          purity: formData.purity,
          wastage: formData.wastage || '',
          gross_weight: formData.gross_weight || '',
          rate_cut_weight: formData.rate_cut_weight || '',
          hallmark_rate: formData.hallmark_rate || '',
          hallmark_qty: formData.hallmark_qty || '',
          stone_rate: formData.stone_rate || '',
          stone_weight: formData.stone_weight || '',
          gold_rate: formData.gold_rate || '',
          remarks: formData.remarks || '',
          status: formData.status || '',
          // Auto-calculated fields
          purity_percentage: formData.purity_percentage || derived.pureWeight,
          total_purity: derived.totalPurity,
          pure_weight: derived.pureWeight,
          fine_weight: derived.fineWeight,
          fine_weight_with_wastage: derived.fineWeightWithWastage,
          hallmark_amount: derived.hallmarkAmount,
          stone_amount: derived.stoneAmount,
          amount: derived.amount,
          total_taxable_amount: derived.totalTaxableAmount,
          sgst: derived.sgst,
          cgst: derived.cgst,
          final_amount: derived.finalAmount,
          // These fields are auto-generated, include only for view mode
          voucher_no: readOnly ? formData.voucher_no : '',
          transaction_date: readOnly ? formData.transaction_date : '',
          created_at: readOnly ? formData.created_at : '',
          modified_at: readOnly ? formData.modified_at : '',
          created_by: readOnly ? formData.created_by : '',
          modified_by: readOnly ? formData.modified_by : '',
        };
        return payload;
      },
      validate: () => validate(),
    }));

    useEffect(() => {
      if (initialData) {
        setFormData((prev) => ({
          ...emptyForm,
          ...prev,
          ...initialData,
        }));
      }
    }, [initialData]);

    useEffect(() => {
      if (!openSelectKey) return;
      const handleClick = (e: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
          setOpenSelectKey(null);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [openSelectKey]);

    // Handle change for text fields with max length
    const handleTextChange = (key: keyof MetalLedgerFormData, value: string, maxLength: number) => {
      const trimmed = value.slice(0, maxLength);
      setFormData((prev) => ({ ...prev, [key]: trimmed }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
    };

    // Handle change for NUMERIC(18,4) fields - weights and amounts
    const handleNumeric184Change = (key: keyof MetalLedgerFormData, value: string) => {
      const sanitized = sanitizeNumeric184Input(value);
      setFormData((prev) => ({ ...prev, [key]: sanitized }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
    };

    // Handle change for NUMERIC(6,3) fields - wastage and purity percentages
    const handleNumeric63Change = (key: keyof MetalLedgerFormData, value: string) => {
      const sanitized = sanitizeNumeric63Input(value);
      setFormData((prev) => ({ ...prev, [key]: sanitized }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
    };

    // Legacy handler for dropdown selections
    const handleChange = (key: keyof MetalLedgerFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
    };

    const validate = (): boolean => {
      const next: Record<string, string> = {};

      // Required field validations
      if (!formData.entry_type) next.entry_type = 'Entry Type is required';
      if (!formData.metal_type) next.metal_type = 'Metal Type is required';
      if (!formData.transaction_type) next.transaction_type = 'Transaction Type is required';
      if (!formData.customer) next.customer = 'Customer is required';
      if (!formData.item_name) next.item_name = 'Item Name is required';
      if (!formData.purity) next.purity = 'Purity is required';
      if (!formData.gross_weight) next.gross_weight = 'Gross Weight is required';

      // Text field length validations based on DDL constraints
      const trimmedVoucherNo = formData.voucher_no.trim();
      if (trimmedVoucherNo && trimmedVoucherNo.length > MAX_VOUCHER_NO_LENGTH) {
        next.voucher_no = maxLengthError('Voucher No', MAX_VOUCHER_NO_LENGTH);
      }

      const trimmedRemarks = formData.remarks.trim();
      if (trimmedRemarks && trimmedRemarks.length > MAX_TEXT_FIELD_LENGTH) {
        next.remarks = maxLengthError('Remarks');
      }

      // Numeric(18,4) field validations - weights and amounts
      const grossWeightError = validateNumeric184(formData.gross_weight, 'Gross Weight', { nonNegative: true });
      if (grossWeightError) next.gross_weight = grossWeightError;

      const pureWeightError = validateNumeric184(formData.pure_weight, 'Pure Weight', { nonNegative: true });
      if (pureWeightError) next.pure_weight = pureWeightError;

      const fineWeightError = validateNumeric184(formData.fine_weight, 'Fine Weight', { nonNegative: true });
      if (fineWeightError) next.fine_weight = fineWeightError;

      const fineWeightWithWastageError = validateNumeric184(formData.fine_weight_with_wastage, 'Fine Weight with Wastage', { nonNegative: true });
      if (fineWeightWithWastageError) next.fine_weight_with_wastage = fineWeightWithWastageError;

      const rateCutWeightError = validateNumeric184(formData.rate_cut_weight, 'Rate Cut Weight', { nonNegative: true });
      if (rateCutWeightError) next.rate_cut_weight = rateCutWeightError;

      const goldRateError = validateNumeric184(formData.gold_rate, 'Gold Rate', { nonNegative: true });
      if (goldRateError) next.gold_rate = goldRateError;

      const hallmarkRateError = validateNumeric184(formData.hallmark_rate, 'Hallmark Rate', { nonNegative: true });
      if (hallmarkRateError) next.hallmark_rate = hallmarkRateError;

      const hallmarkQtyError = validateNumeric184(formData.hallmark_qty, 'Hallmark Qty', { nonNegative: true });
      if (hallmarkQtyError) next.hallmark_qty = hallmarkQtyError;

      const hallmarkAmountError = validateNumeric184(formData.hallmark_amount, 'Hallmark Amount', { nonNegative: true });
      if (hallmarkAmountError) next.hallmark_amount = hallmarkAmountError;

      const stoneRateError = validateNumeric184(formData.stone_rate, 'Stone Rate', { nonNegative: true });
      if (stoneRateError) next.stone_rate = stoneRateError;

      const stoneWeightError = validateNumeric184(formData.stone_weight, 'Stone Weight', { nonNegative: true });
      if (stoneWeightError) next.stone_weight = stoneWeightError;

      const stoneAmountError = validateNumeric184(formData.stone_amount, 'Stone Amount', { nonNegative: true });
      if (stoneAmountError) next.stone_amount = stoneAmountError;

      // Numeric(6,3) field validations - wastage and purity percentages
      const wastageError = validateNumeric63(formData.wastage, 'Wastage', { nonNegative: true });
      if (wastageError) next.wastage = wastageError;

      const totalPurityError = validateNumeric63(formData.total_purity, 'Total Purity', { nonNegative: true });
      if (totalPurityError) next.total_purity = totalPurityError;

      setErrors(next);
      return Object.keys(next).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (validate() && onSubmit) {
        const payload: Record<string, unknown> = {
          entry_type: formData.entry_type,
          metal_type: formData.metal_type,
          transaction_type: formData.transaction_type,
          customer: formData.customer,
          item_name: formData.item_name,
          purity: formData.purity,
          wastage: formData.wastage ? parseFloat(formData.wastage) : null,
          gross_weight: formData.gross_weight ? parseFloat(formData.gross_weight) : null,
          rate_cut_weight: formData.rate_cut_weight ? parseFloat(formData.rate_cut_weight) : null,
          hallmark_rate: formData.hallmark_rate ? parseFloat(formData.hallmark_rate) : null,
          hallmark_qty: formData.hallmark_qty ? parseFloat(formData.hallmark_qty) : null,
          stone_rate: formData.stone_rate ? parseFloat(formData.stone_rate) : null,
          stone_weight: formData.stone_weight ? parseFloat(formData.stone_weight) : null,
          gold_rate: formData.gold_rate ? parseFloat(formData.gold_rate) : null,
          remarks: formData.remarks || null,
          // Auto-calculated fields
          purity_percentage: parseFloat(derived.pureWeight) || null,
          pure_weight: parseFloat(derived.pureWeight) || null,
          fine_weight: parseFloat(derived.fineWeight) || null,
          fine_weight_with_wastage: parseFloat(derived.fineWeightWithWastage) || null,
          hallmark_amount: parseFloat(derived.hallmarkAmount) || null,
          stone_amount: parseFloat(derived.stoneAmount) || null,
          amount: parseFloat(derived.amount) || null,
          total_taxable_amount: parseFloat(derived.totalTaxableAmount) || null,
          sgst: parseFloat(derived.sgst) || null,
          cgst: parseFloat(derived.cgst) || null,
          final_amount: parseFloat(derived.finalAmount) || null,
        };

        // Only include auto-generated and audit fields in view mode
        if (readOnly) {
          payload.voucher_no = formData.voucher_no;
          payload.transaction_date = formData.transaction_date;
          payload.created_at = formData.created_at;
          payload.modified_at = formData.modified_at;
          payload.created_by = formData.created_by;
          payload.modified_by = formData.modified_by;
        }

        onSubmit(payload as MetalLedgerFormData);
      }
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

    // Read-only input class - same as editable input for consistent appearance
    const readOnlyClass = `w-full px-4 py-2.5 text-sm rounded-lg border ${isDarkMode
      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
      : 'bg-white border-gray-300 text-gray-900'
      }`;

    const labelClass = `block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`;

    const sectionClass = `border rounded-lg p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
      }`;

    const sectionTitleClass = `text-lg font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
      }`;

    const errorClass = `text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`;

    // Custom dropdown render function
    const renderSelect = (
      key: keyof MetalLedgerFormData,
      label: string,
      options: Array<{ label: string; value: string }>,
      value: string,
      required = false
    ) => {
      const currentLabel = options.find((o) => o.value === value)?.label ?? `Select ${label}`;
      if (readOnly) {
        return (
          <div className={readOnlyClass}>{currentLabel === `Select ${label}` ? '—' : currentLabel}</div>
        );
      }
      const isOpen = openSelectKey === key;
      return (
        <div ref={key === openSelectKey ? selectRef : undefined} className="relative">
          <button
            type="button"
            onClick={() => setOpenSelectKey(isOpen ? null : key)}
            className={`${inputClass(key)} flex items-center justify-between text-left min-h-[42px] ${isOpen ? 'ring-2 ring-blue-500/30' : ''
              }`}
          >
            <span className={!value ? (isDarkMode ? 'text-gray-500' : 'text-gray-400') : ''}>
              {currentLabel}
            </span>
            <svg
              className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isOpen && (
            <div
              className={`absolute left-0 right-0 top-full z-50 mt-1 py-1 rounded-lg border shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                }`}
            >
              <button
                type="button"
                onClick={() => {
                  handleChange(key, '');
                  setOpenSelectKey(null);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
                  } ${!value ? (isDarkMode ? 'bg-blue-600/20' : 'bg-blue-50') : ''}`}
              >
                Select {label}
              </button>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    handleChange(key, opt.value);
                    setOpenSelectKey(null);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    } ${value === opt.value ? (isDarkMode ? 'bg-blue-600/20' : 'bg-blue-50') : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {errors[key] && <p className={`mt-1 ${errorClass}`}>{errors[key]}</p>}
        </div>
      );
    };

    // Section 1: Ledger Info
    const ledgerInfoSection = (
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Ledger Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {readOnly && (
            <div>
              <label className={labelClass}>Voucher No</label>
              <input
                type="text"
                value={formData.voucher_no}
                className={readOnlyClass}
                disabled
                readOnly
              />
            </div>
          )}

          <div>
            <label className={labelClass}>
              Entry Type <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            {renderSelect('entry_type', 'Entry Type', ENTRY_TYPE_OPTIONS, formData.entry_type, true)}
          </div>

          <div>
            <label className={labelClass}>
              Metal Type <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            {renderSelect('metal_type', 'Metal Type', METAL_TYPE_OPTIONS, formData.metal_type, true)}
          </div>

          <div>
            <label className={labelClass}>
              Transaction Type <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            {renderSelect(
              'transaction_type',
              'Transaction Type',
              TRANSACTION_TYPE_OPTIONS,
              formData.transaction_type,
              true
            )}
          </div>

          {readOnly && (
            <div>
              <label className={labelClass}>Transaction Date</label>
              <input
                type="date"
                value={formData.transaction_date}
                className={readOnlyClass}
                disabled
                readOnly
              />
            </div>
          )}

          <div>
            <label className={labelClass}>
              Customer <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            {renderSelect('customer', 'Customer', customerOptions, formData.customer, true)}
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <label className={labelClass}>Remarks</label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => handleTextChange('remarks', e.target.value, MAX_TEXT_FIELD_LENGTH)}
              placeholder="Enter remarks"
              maxLength={MAX_TEXT_FIELD_LENGTH}
              className={inputClass('remarks')}
              disabled={readOnly}
            />
            {errors.remarks && <p className={`mt-1 ${errorClass}`}>{errors.remarks}</p>}
          </div>
        </div>
      </div>
    );

    // Section 2: Item Details
    const itemSection = (
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Item Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Item Name <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            {renderSelect('item_name', 'Item', itemOptions, formData.item_name, true)}
            {errors.item_name && <p className={`mt-1 ${errorClass}`}>{errors.item_name}</p>}
          </div>
        </div>
      </div>
    );

    // Section 3: Purity Details
    const puritySection = (
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Purity Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>
              Purity <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            {renderSelect('purity', 'Purity', purityOptions, formData.purity, true)}
            {errors.purity && <p className={`mt-1 ${errorClass}`}>{errors.purity}</p>}
          </div>

          <div>
            <label className={labelClass}>Purity Percentage (%)</label>
            <input
              type="text"
              value={formData.purity_percentage || derived.pureWeight}
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Wastage (%)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.wastage}
              onChange={(e) => handleNumeric63Change('wastage', e.target.value)}
              placeholder="Enter wastage"
              maxLength={MAX_NUMERIC_63_LENGTH}
              className={inputClass('wastage')}
              disabled={readOnly}
            />
            {errors.wastage && <p className={`mt-1 ${errorClass}`}>{errors.wastage}</p>}
          </div>

          <div>
            <label className={labelClass}>Total Purity (%)</label>
            <input
              type="text"
              value={derived.totalPurity}
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>
        </div>
      </div>
    );

    // Section 4: Weight Details
    const weightSection = (
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Weight Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className={labelClass}>
              Gross Weight <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.gross_weight}
              onChange={(e) => handleNumeric184Change('gross_weight', e.target.value)}
              placeholder="Enter gross weight"
              maxLength={MAX_NUMERIC_184_LENGTH}
              className={inputClass('gross_weight')}
              disabled={readOnly}
            />
            {errors.gross_weight && <p className={`mt-1 ${errorClass}`}>{errors.gross_weight}</p>}
          </div>

          <div>
            <label className={labelClass}>Pure Weight</label>
            <input
              type="text"
              value={derived.pureWeight}
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Fine Weight</label>
            <input
              type="text"
              value={derived.fineWeight}
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Fine Weight with Wastage</label>
            <input
              type="text"
              value={derived.fineWeightWithWastage}
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Rate Cut Weight</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.rate_cut_weight}
              onChange={(e) => handleNumeric184Change('rate_cut_weight', e.target.value)}
              placeholder="Enter rate cut weight"
              maxLength={MAX_NUMERIC_184_LENGTH}
              className={inputClass('rate_cut_weight')}
              disabled={readOnly}
            />
            {errors.rate_cut_weight && <p className={`mt-1 ${errorClass}`}>{errors.rate_cut_weight}</p>}
          </div>
        </div>
      </div>
    );

    // Section 5: Hallmark Details
    const hallmarkSection = (
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Hallmark Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Hallmark Rate</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.hallmark_rate}
              onChange={(e) => handleNumeric184Change('hallmark_rate', e.target.value)}
              placeholder="Enter hallmark rate"
              maxLength={MAX_NUMERIC_184_LENGTH}
              className={inputClass('hallmark_rate')}
              disabled={readOnly}
            />
            {errors.hallmark_rate && <p className={`mt-1 ${errorClass}`}>{errors.hallmark_rate}</p>}
          </div>

          <div>
            <label className={labelClass}>Hallmark Qty</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.hallmark_qty}
              onChange={(e) => handleNumeric184Change('hallmark_qty', e.target.value)}
              placeholder="Enter hallmark qty"
              maxLength={MAX_NUMERIC_184_LENGTH}
              className={inputClass('hallmark_qty')}
              disabled={readOnly}
            />
            {errors.hallmark_qty && <p className={`mt-1 ${errorClass}`}>{errors.hallmark_qty}</p>}
          </div>

          <div>
            <label className={labelClass}>Hallmark Amount</label>
            <input
              type="text"
              value={derived.hallmarkAmount}
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>
        </div>
      </div>
    );

    // Section 6: Stone Details
    const stoneSection = (
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Stone Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Stone Rate</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.stone_rate}
              onChange={(e) => handleNumeric184Change('stone_rate', e.target.value)}
              placeholder="Enter stone rate"
              maxLength={MAX_NUMERIC_184_LENGTH}
              className={inputClass('stone_rate')}
              disabled={readOnly}
            />
            {errors.stone_rate && <p className={`mt-1 ${errorClass}`}>{errors.stone_rate}</p>}
          </div>

          <div>
            <label className={labelClass}>Stone Weight</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.stone_weight}
              onChange={(e) => handleNumeric184Change('stone_weight', e.target.value)}
              placeholder="Enter stone weight"
              maxLength={MAX_NUMERIC_184_LENGTH}
              className={inputClass('stone_weight')}
              disabled={readOnly}
            />
            {errors.stone_weight && <p className={`mt-1 ${errorClass}`}>{errors.stone_weight}</p>}
          </div>

          <div>
            <label className={labelClass}>Stone Amount</label>
            <input
              type="text"
              value={derived.stoneAmount}
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>
        </div>
      </div>
    );

    // Section 7: Amount Details
    const amountSection = (
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Amount Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Gold Rate</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.gold_rate}
              onChange={(e) => handleNumeric184Change('gold_rate', e.target.value)}
              placeholder="Enter gold rate"
              maxLength={MAX_NUMERIC_184_LENGTH}
              className={inputClass('gold_rate')}
              disabled={readOnly}
            />
            {errors.gold_rate && <p className={`mt-1 ${errorClass}`}>{errors.gold_rate}</p>}
          </div>

          <div>
            <label className={labelClass}>Amount</label>
            <input type="text" value={derived.amount} className={readOnlyClass} disabled readOnly />
          </div>

          <div>
            <label className={labelClass}>Total Taxable Amount</label>
            <input
              type="text"
              value={derived.totalTaxableAmount}
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>SGST ({formData.transaction_type === 'LABOUR' ? '2.5%' : '1.5%'})</label>
            <input type="text" value={derived.sgst} className={readOnlyClass} disabled readOnly />
          </div>

          <div>
            <label className={labelClass}>CGST ({formData.transaction_type === 'LABOUR' ? '2.5%' : '1.5%'})</label>
            <input type="text" value={derived.cgst} className={readOnlyClass} disabled readOnly />
          </div>

          <div>
            <label className={labelClass}>Final Amount</label>
            <input
              type="text"
              value={derived.finalAmount}
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>
        </div>
      </div>
    );

    // Section 8: Audit Trails
    const auditSection = (
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Audit Trails</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Created At</label>
            <input
              type="datetime-local"
              value={formData.created_at ? formData.created_at.slice(0, 16) : ''}
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Modified At</label>
            <input
              type="datetime-local"
              value={formData.modified_at ? formData.modified_at.slice(0, 16) : ''}
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Created By</label>
            <input
              type="text"
              value={formData.created_by}
              placeholder="—"
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Modified By</label>
            <input
              type="text"
              value={formData.modified_by}
              placeholder="—"
              className={readOnlyClass}
              disabled
              readOnly
            />
          </div>
        </div>
      </div>
    );

    const fields = (
      <>
        {ledgerInfoSection}
        {itemSection}
        {puritySection}
        {weightSection}
        {hallmarkSection}
        {stoneSection}
        {amountSection}
        {readOnly && auditSection}
      </>
    );

    const actions = showActions && (
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
          {submitLoading ? 'Saving...' : isEdit ? ' Update Metal Ledger' : ' Create Metal Ledger'}
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

export default MetalLedgerFormInner;
