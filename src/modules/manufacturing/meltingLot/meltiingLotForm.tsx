import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import {
  MAX_TEXT_FIELD_LENGTH,
  MAX_LENGTH_4,
  maxLengthError,
  validateNumeric184,
  sanitizeNumeric184Interactive,
  canAcceptNumeric184Key,
  validateUppercaseOnly,
} from '../../../shared/utils/formValidation';
import type { ReferenceOption } from '../../admin/admin.api';
import {
  getEntityReferences,
  getEntityReferenceOptionsFiltered,
  mapReferenceItemsToOptions,
} from '../../admin/admin.api';
import { fetchMetalPoolBalance, type MetalPoolBalance } from './meltingLot.api';
import EditableWeightTable from '../../../shared/components/EditableWeightTable';
import { FormSelect } from '../../../shared/components/FormSelect';
import { toast } from '../../../stores/toast.store';

export type MeltingLotFormData = {
  // Form fields
  parent_melting_lot: string;
  product: string;
  purity: string;
  purity_percentage: string;  // Main purity percentage for the lot
  accessory_purity: string;
  wire_size: string;
  thickness: string;
  design_name: string;
  description: string;

  // Weight details
  weight_details: WeightDetail[];

  // Weight details totals
  total_alloy_vadotar: string;
};

export type WeightDetail = {
  id?: string;  // UUID for existing weight details (for update)
  selected_weight: string;
  selected_purity: string;
  purity_percentage: string;
  fine_weight: string;
  alloy_weight: string;
  description: string;
};

export interface MeltingLotFormRef {
  getData: () => MeltingLotFormData;
  validate: () => boolean;
}

export interface MeltingLotFormProps {
  initialData?: Partial<MeltingLotFormData>;
  onSubmit?: (data: MeltingLotFormData) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnly?: boolean;
  submitLoading?: boolean;
  wrapInForm?: boolean;
  showActions?: boolean;
  meltingLotPurityPercentage?: number;
}

const emptyForm: MeltingLotFormData = {
  parent_melting_lot: '',
  product: '',
  purity: '',
  purity_percentage: '',
  accessory_purity: '',
  wire_size: '',
  thickness: '',
  design_name: '',
  description: '',
  weight_details: [],
  total_alloy_vadotar: '',
};

const emptyWeightDetail: WeightDetail = {
  selected_weight: '',
  selected_purity: '',
  purity_percentage: '',
  fine_weight: '',
  alloy_weight: '',
  description: '',
};

// Helper to parse string to number safely
function toNum(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : 0;
}

const MeltingLotFormInner = forwardRef<MeltingLotFormRef, MeltingLotFormProps>(function MeltingLotFormInner(
  { initialData, onCancel, isEdit = false, readOnly = false, submitLoading = false, wrapInForm = true, showActions = true, meltingLotPurityPercentage },
  ref
) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const [formData, setFormData] = useState<MeltingLotFormData>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reference data states
  const [parentMeltingLotOptions, setParentMeltingLotOptions] = useState<ReferenceOption[]>([]);
  const [parentMeltingLotRawData, setParentMeltingLotRawData] = useState<Record<string, unknown>[]>([]);
  const [productOptions, setProductOptions] = useState<ReferenceOption[]>([]);
  const [purityOptions, setPurityOptions] = useState<ReferenceOption[]>([]);
  const [purityPercentageMap, setPurityPercentageMap] = useState<Record<string, number>>({});
  const [accessoryPurityOptions, setAccessoryPurityOptions] = useState<ReferenceOption[]>([]);
  const [wireSizeOptions, setWireSizeOptions] = useState<ReferenceOption[]>([]);
  const [thicknessOptions, setThicknessOptions] = useState<ReferenceOption[]>([]);
  const [designOptions, setDesignOptions] = useState<ReferenceOption[]>([]);

  // Metal pool balance from API
  const [metalPoolBalance, setMetalPoolBalance] = useState<MetalPoolBalance[]>([]);
  const [metalPoolLoading, setMetalPoolLoading] = useState(false);

  // Weight input for each metal pool entry (key is purity)
  const [metalPoolWeights, setMetalPoolWeights] = useState<Record<string, string>>({});

  // Weight errors for metal pool entries (key is purity)
  const [metalPoolWeightErrors, setMetalPoolWeightErrors] = useState<Record<string, string>>({});

  // Weight details visibility
  const [showWeightDetails, setShowWeightDetails] = useState(false);

  // Load parent melting lot references
  useEffect(() => {
    getEntityReferences('parent_melting_lot')
      .then((items) => {
        const opts = mapReferenceItemsToOptions(items, 'name', 'name');
        setParentMeltingLotOptions(opts.length > 0 ? opts : items.map((row: Record<string, unknown>) => ({
          value: String(row.name ?? ''),
          label: String(row.name ?? ''),
        })));
        setParentMeltingLotRawData(items);
      })
      .catch(() => {
        setParentMeltingLotOptions([]);
        setParentMeltingLotRawData([]);
      });
  }, []);

  // Load all purities once (for percentage map)
  useEffect(() => {
    getEntityReferences('purity')
      .then((items) => {
        const percentageMap: Record<string, number> = {};
        items.forEach((row: Record<string, unknown>) => {
          const purity = String(row.purity ?? '');
          percentageMap[purity] = Number(row.purity_percentage) || 0;
        });
        setPurityPercentageMap(percentageMap);
      })
      .catch(() => setPurityPercentageMap({}));
  }, []);

  // Load product and purity options - filtered by parent_melting_lot when selected
  useEffect(() => {
    const parentName = formData.parent_melting_lot?.trim();
    const parentItem = parentName
      ? parentMeltingLotRawData.find((r) => String(r.name ?? '') === parentName)
      : null;
    const parentProduct = parentItem ? String(parentItem.product ?? '') : '';
    const parentPurity = parentItem ? String(parentItem.purity ?? '') : '';

    if (parentProduct && parentPurity) {
      setProductOptions([{ value: parentProduct, label: parentProduct }]);
      setPurityOptions([{ value: parentPurity, label: parentPurity }]);
      return;
    }

    // No parent selected - load all products and purities
    let ignore = false;
    Promise.all([
      getEntityReferences('product'),
      getEntityReferences('purity'),
    ])
      .then(([productItems, purityItems]) => {
        if (ignore) return;
        const productOpts = mapReferenceItemsToOptions(productItems, 'product_name', 'product_name');
        setProductOptions(productOpts.length > 0 ? productOpts : productItems.map((row: Record<string, unknown>) => ({
          value: String(row.product_name ?? ''),
          label: String(row.product_name ?? ''),
        })));

        const purityOpts = purityItems.map((row: Record<string, unknown>) => {
          const purity = String(row.purity ?? '');
          return { value: purity, label: purity };
        });
        setPurityOptions(purityOpts);
      })
      .catch(() => {
        if (ignore) return;
        setProductOptions([]);
        setPurityOptions([]);
      });
    return () => {
      ignore = true;
    };
  }, [formData.parent_melting_lot, parentMeltingLotRawData]);

  // Load product-dependent dropdowns (wire_size, thickness, design, accessory_purity) filtered by selected product
  useEffect(() => {
    const productName = formData.product?.trim();
    if (!productName) {
      setWireSizeOptions([]);
      setThicknessOptions([]);
      setDesignOptions([]);
      setAccessoryPurityOptions([]);
      return;
    }
    let ignore = false;
    Promise.all([
      getEntityReferenceOptionsFiltered('wire_size', productName, 'wire_size', 'wire_size'),
      getEntityReferenceOptionsFiltered('thickness', productName, 'thickness', 'thickness'),
      getEntityReferenceOptionsFiltered('design', productName, 'design_name', 'design_name'),
      getEntityReferenceOptionsFiltered('accessory_purity', productName, 'accessory_purity', 'accessory_purity'),
    ])
      .then(([wire, thick, design, accessory]) => {
        if (ignore) return;
        setWireSizeOptions(wire);
        setThicknessOptions(thick);
        setDesignOptions(design);
        setAccessoryPurityOptions(accessory);
      })
      .catch(() => {
        if (ignore) return;
        setWireSizeOptions([]);
        setThicknessOptions([]);
        setDesignOptions([]);
        setAccessoryPurityOptions([]);
      });
    return () => {
      ignore = true;
    };
  }, [formData.product]);

  // Fetch metal pool balance
  useEffect(() => {
    setMetalPoolLoading(true);
    fetchMetalPoolBalance()
      .then((data) => {
        setMetalPoolBalance(data);
        
        // If we have initial weight details, populate metalPoolWeights with them
        if (initialData?.weight_details && initialData.weight_details.length > 0) {
          const weights: Record<string, string> = {};
          initialData.weight_details.forEach((wd) => {
            if (wd.selected_purity && wd.selected_weight) {
              weights[wd.selected_purity] = wd.selected_weight;
            }
          });
          setMetalPoolWeights(weights);
          // Also show weight details section
          setShowWeightDetails(true);
        }
      })
      .catch(() => {
        setMetalPoolBalance([]);
      })
      .finally(() => {
        setMetalPoolLoading(false);
      });
  }, [initialData]);

  // Calculate weight detail fields
  const calculateWeightDetail = (detail: WeightDetail, meltingPurityPct: number): WeightDetail => {
    const weight = toNum(detail.selected_weight);
    const purityPct = toNum(detail.purity_percentage);

    // Fine Weight = weight × purity_percentage / 100
    const fineWeight = weight > 0 && purityPct > 0 ? (weight * purityPct) / 100 : 0;

    // Alloy Weight = (Fine Weight / melting_lot_purity) * 100 - weight
    const alloyWeight = fineWeight > 0 && meltingPurityPct > 0 ? (fineWeight / meltingPurityPct) * 100 - weight : 0;

    return {
      ...detail,
      fine_weight: fineWeight > 0 ? fineWeight.toFixed(4) : '',
      alloy_weight: alloyWeight >= 0 ? alloyWeight.toFixed(4) : '0.0000',
    };
  };

  // Get current purity percentage from form selection
  const currentPurityPercentage = formData.purity ? (purityPercentageMap[formData.purity] || meltingLotPurityPercentage || 0) : (meltingLotPurityPercentage || 0);

  // Update weight details when purity changes
  const updateWeightDetailsPurity = (details: WeightDetail[]) => {
    return details.map((detail) => calculateWeightDetail(detail, currentPurityPercentage));
  };

  useImperativeHandle(ref, () => ({
    getData: () => formData,
    validate: () => validate(),
  }));

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...emptyForm,
        ...initialData,
        weight_details: prev.weight_details.length > 0 ? prev.weight_details : (initialData.weight_details || []),
      }));
    }
  }, [initialData]);

  // Handle change for text fields
  const handleTextChange = (key: keyof MeltingLotFormData, value: string, maxLength: number) => {
    const trimmed = value.slice(0, maxLength);
    setFormData((prev) => ({ ...prev, [key]: trimmed }));

    // Live validation for Total Alloy Vadotar: numeric(18,4) NOT NULL
    if (key === 'total_alloy_vadotar') {
      const val = trimmed.trim();
      if (val){
        const vadErr = validateNumeric184(val, 'Total Alloy Vadotar');
        setErrors((prev) => ({ ...prev, total_alloy_vadotar: vadErr ?? '' }));
      }
      return;
    }

    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleTotalAlloyVadotarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const current = input.value || '';
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;

    const ok = canAcceptNumeric184Key(current, selectionStart, selectionEnd, e.key, true);
    if (!ok) {
      e.preventDefault();
    }
  };

  const handleTotalAlloyVadotarPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text') ?? '';
    const cleaned = sanitizeNumeric184Interactive(text, formData.total_alloy_vadotar || '', true);
    handleTextChange('total_alloy_vadotar', cleaned, MAX_TEXT_FIELD_LENGTH);
  };

  const handleMetalPoolWeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const current = input.value || '';
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;

    const ok = canAcceptNumeric184Key(current, selectionStart, selectionEnd, e.key, true);
    if (!ok) {
      e.preventDefault();
    }
  };

  const handleMetalPoolWeightPaste = (
    purity: string,
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text') ?? '';
    const previous = metalPoolWeights[purity] || '';
    const cleaned = sanitizeNumeric184Interactive(text, previous, true);
    handleMetalPoolWeightChange(purity, cleaned);
  };

  // Legacy handler for dropdown selections
  const handleChange = (key: keyof MeltingLotFormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'parent_melting_lot') {
        next.product = '';
        next.purity = '';
        next.wire_size = '';
        next.thickness = '';
        next.design_name = '';
        next.accessory_purity = '';
      } else if (key === 'product') {
        next.wire_size = '';
        next.thickness = '';
        next.design_name = '';
        next.accessory_purity = '';
      }
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  // Handle weight detail cell change
  const handleWeightDetailChange = (index: number, key: string, value: string) => {
    const newDetails = [...formData.weight_details];
    let updated = { ...newDetails[index], [key]: value };
    
    // When selected_purity changes, also update purity_percentage from metal pool balance
    if (key === 'selected_purity') {
      const poolEntry = metalPoolBalance.find(b => b.purity === value);
      if (poolEntry) {
        updated = { ...updated, purity_percentage: String(poolEntry.purity_percentage) };
      }
    }
    
    newDetails[index] = calculateWeightDetail(updated as WeightDetail, currentPurityPercentage);
    setFormData((prev) => ({ ...prev, weight_details: newDetails }));
  };

  // Add weight detail row
  const handleAddWeightDetail = () => {
    setFormData((prev) => ({
      ...prev,
      weight_details: [...prev.weight_details, { ...emptyWeightDetail }],
    }));
    setShowWeightDetails(true);
  };

  // Delete weight detail row
  const handleDeleteWeightDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      weight_details: prev.weight_details.filter((_, i) => i !== index),
    }));
  };

  // Clear weight detail row - empties values but keeps the row
  const handleClearWeightDetail = (index: number) => {
    const detail = formData.weight_details[index];
    
    // Clear the corresponding metal pool weight
    if (detail.selected_purity) {
      setMetalPoolWeights((prev) => {
        const newWeights = { ...prev };
        delete newWeights[detail.selected_purity];
        return newWeights;
      });
    }
    
    // Clear the weight detail row values (keep the row, just empty values)
    setFormData((prev) => {
      const newDetails = [...prev.weight_details];
      newDetails[index] = { ...emptyWeightDetail };
      return { ...prev, weight_details: newDetails };
    });
  };

  // Handle metal pool weight input change
  const handleMetalPoolWeightChange = (purity: string, value: string) => {
    setMetalPoolWeights((prev) => ({
      ...prev,
      [purity]: value,
    }));

    // Validate numeric (18,4) and against balance weight
    const trimmed = value.trim();
    if (!trimmed) {
      setMetalPoolWeightErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[purity];
        return newErrors;
      });
      return;
    }

    // Numeric (18,4)
    const numericErr = validateNumeric184(trimmed, 'Weight', { nonNegative: true });
    if (numericErr) {
      setMetalPoolWeightErrors((prev) => ({
        ...prev,
        [purity]: numericErr,
      }));
      return;
    }

    // Balance check
    const balance = metalPoolBalance.find((b) => b.purity === purity);
    if (balance) {
      const enteredWeight = parseFloat(trimmed);
      if (!isNaN(enteredWeight) && enteredWeight > balance.balance_weight) {
        setMetalPoolWeightErrors((prev) => ({
          ...prev,
          [purity]: `Weight exceeds balance weight (${balance.balance_weight.toFixed(4)})`,
        }));
      } else {
        setMetalPoolWeightErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[purity];
          return newErrors;
        });
      }
    }
  };

  // Handler to add weight details from metal pool balance
  const handleAddWeightDetails = () => {
    if (metalPoolBalance.length === 0) return;
    
    // Check if Purity is selected in Melting Lot Details
    if (!formData.purity) {
      toast.error('Please select Purity from Melting Lot Details first');
      return;
    }

    // Check for validation errors before adding
    const hasErrors = Object.keys(metalPoolWeightErrors).length > 0;
    if (hasErrors) {
      toast.error('Please fix weight validation errors before adding weight details');
      return;
    }
    
    // Create weight detail entries only for rows where weight is entered
    const newWeightDetails: WeightDetail[] = [];
    
    metalPoolBalance.forEach((balance) => {
      const weight = metalPoolWeights[balance.purity];
      if (weight && parseFloat(weight) > 0) {
        const purityPct = balance.purity_percentage;
        const weightNum = parseFloat(weight);
        
        // Fine Weight = weight × purity_percentage / 100
        const fineWeight = (weightNum * purityPct) / 100;
        
        // Alloy Weight = (Fine Weight / melting_lot_purity) * 100 - weight
        const alloyWeight = fineWeight > 0 && currentPurityPercentage > 0 ? (fineWeight / currentPurityPercentage) * 100 - weightNum : 0;
        
        // Get existing description if the purity already exists in weight details
        const existingDetail = formData.weight_details.find(
          d => d.selected_purity === balance.purity
        );
        
        newWeightDetails.push({
          selected_weight: weight,
          selected_purity: balance.purity,
          purity_percentage: String(purityPct.toFixed(2)),
          fine_weight: fineWeight > 0 ? fineWeight.toFixed(4) : '',
          alloy_weight: alloyWeight >= 0 ? alloyWeight.toFixed(4) : '0.0000',
          description: existingDetail?.description || '',
        });
      }
    });
    
    if (newWeightDetails.length === 0) return;
    
    // Update existing entries if purity already exists, otherwise add new entries
    setFormData((prev) => {
      const existingPurities = new Map(
        prev.weight_details.map(d => [d.selected_purity, d])
      );
      
      const updatedDetails = [...prev.weight_details];
      
      newWeightDetails.forEach(newDetail => {
        if (existingPurities.has(newDetail.selected_purity)) {
          // Update existing entry
          const index = updatedDetails.findIndex(
            d => d.selected_purity === newDetail.selected_purity
          );
          if (index !== -1) {
            updatedDetails[index] = newDetail;
          }
        } else {
          // Add new entry
          updatedDetails.push(newDetail);
        }
      });
      
      return { 
        ...prev, 
        weight_details: updatedDetails,
      };
    });
    
    setShowWeightDetails(true);
    
    // Clear the weight inputs after adding
    setMetalPoolWeights({});
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    // Required field validations
    if (!formData.product) next.product = 'Product is required';
    if (!formData.purity) next.purity = 'Purity is required';

    // Parent Melting Lot → Product Abbreviation validation
    if (formData.parent_melting_lot) {
      const parentName = formData.parent_melting_lot.trim();
      const parentItem = parentMeltingLotRawData.find(
        (r) => String(r.name ?? '') === parentName
      );
      if (parentItem) {
        const rawAbbr =
          (parentItem as Record<string, unknown>).product_abbreviation ??
          (parentItem as Record<string, unknown>).product_abbrevation ??
          '';
        const abbr = String(rawAbbr ?? '').trim();
        if (!abbr) {
          next.parent_melting_lot =
            'Product abbreviation is required for the selected Parent Melting Lot';
        } else {
          if (abbr.length > MAX_LENGTH_4) {
            next.parent_melting_lot = maxLengthError(
              'Product abbreviation',
              MAX_LENGTH_4
            );
          } else {
            const upperErr = validateUppercaseOnly(
              abbr,
              'Product abbreviation'
            );
            if (upperErr) {
              next.parent_melting_lot = upperErr;
            }
          }
        }
      }
    }

    // Text field length validations
    const trimmedDescription = formData.description.trim();
    if (trimmedDescription && trimmedDescription.length > MAX_TEXT_FIELD_LENGTH) {
      next.description = maxLengthError('Description');
    }

    // Total Alloy Vadotar numeric (18,4) NOT NULL
    const vadotar = formData.total_alloy_vadotar.trim();
    if (vadotar) {
      const vadErr = validateNumeric184(
        vadotar,
        'Total Alloy Vadotar',
        { nonNegative: true }
      );
      if (vadErr) {
        next.total_alloy_vadotar = vadErr;
      }
    }

    // Validate weight details
    formData.weight_details.forEach((detail, index) => {
      if (!detail.selected_weight) {
        next[`weight_${index}`] = `Weight is required for row ${index + 1}`;
      } else {
        const weightError = validateNumeric184(detail.selected_weight, 'Weight', { nonNegative: true });
        if (weightError) next[`weight_${index}`] = weightError;
      }

      if (!detail.selected_purity) {
        next[`purity_${index}`] = `Purity is required for row ${index + 1}`;
      }
    });

    setErrors(next);
    return Object.keys(next).length === 0;
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

  const readOnlyClass = `w-full px-4 py-2.5 text-sm rounded-lg border ${
    isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'
  }`;

  const labelClass = `block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  const sectionClass = `border rounded-lg p-4 ${
    isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
  }`;

  const sectionTitleClass = `text-lg font-semibold mb-4 pb-2 border-b ${
    isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
  }`;

  const errorClass = `text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`;

  // Weight Details columns - Fine Weight and Alloy Weight are calculated, others editable
  const weightDetailColumns = [
    { key: 'selected_weight', header: 'Weight', width: 'w-28', isReadOnly: true },
    { key: 'selected_purity', header: 'Purity', width: 'w-32', isReadOnly: true },
    { key: 'purity_percentage', header: 'Purity %', width: 'w-24', isReadOnly: true },
    { key: 'fine_weight', header: 'Fine Weight', width: 'w-28', isReadOnly: true },
    { key: 'alloy_weight', header: 'Alloy Weight', width: 'w-28', isReadOnly: true },
    { key: 'description', header: 'Description', width: 'w-40', isEditable: true },
  ];

  // Section 1: Form Fields
  const formFieldsSection = (
    <div className={sectionClass}>
      <h3 className={sectionTitleClass}>Melting Lot Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className={labelClass}>Parent Melting Lot</label>
          {readOnly ? (
            <div className={readOnlyClass}>
              {formData.parent_melting_lot
                ? parentMeltingLotOptions.find((o) => o.value === formData.parent_melting_lot)?.label ?? formData.parent_melting_lot
                : '–'}
            </div>
          ) : (
            <>
              <FormSelect
                value={formData.parent_melting_lot}
                onChange={(v) => handleChange('parent_melting_lot', v)}
                options={parentMeltingLotOptions}
                placeholder="Select Parent Melting Lot"
                isDarkMode={isDarkMode}
                className={errors.parent_melting_lot ? 'border-red-500' : ''}
              />
              {errors.parent_melting_lot && (
                <p className={`mt-1 ${errorClass}`}>{errors.parent_melting_lot}</p>
              )}
            </>
          )}
        </div>
        <div>
          <label className={labelClass}>
            Product <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
          </label>
          {readOnly ? (
            <div className={readOnlyClass}>
              {formData.product ? productOptions.find((o) => o.value === formData.product)?.label ?? formData.product : '–'}
            </div>
          ) : (
            <>
              <FormSelect
                value={formData.product}
                onChange={(v) => handleChange('product', v)}
                options={productOptions}
                placeholder="Select Product"
                isDarkMode={isDarkMode}
                className={errors.product ? 'border-red-500' : ''}
              />
              {errors.product && <p className={`mt-1 ${errorClass}`}>{errors.product}</p>}
            </>
          )}
        </div>

        <div>
          <label className={labelClass}>
            Purity <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
          </label>
          {readOnly ? (
            <div className={readOnlyClass}>
              {formData.purity ? purityOptions.find((o) => o.value === formData.purity)?.label ?? formData.purity : '–'}
            </div>
          ) : (
            <>
              <FormSelect
                value={formData.purity}
                onChange={(v) => handleChange('purity', v)}
                options={purityOptions}
                placeholder="Select Purity"
                isDarkMode={isDarkMode}
                className={errors.purity ? 'border-red-500' : ''}
              />
              {errors.purity && <p className={`mt-1 ${errorClass}`}>{errors.purity}</p>}
            </>
          )}
        </div>

        <div>
          <label className={labelClass}>Purity %</label>
          <div className={readOnlyClass}>
            {currentPurityPercentage > 0 ? `${currentPurityPercentage}` : '–'}
          </div>
        </div>

        <div>
          <label className={labelClass}>Accessory Purity</label>
          {readOnly ? (
            <div className={readOnlyClass}>
              {formData.accessory_purity
                ? accessoryPurityOptions.find((o) => o.value === formData.accessory_purity)?.label ?? formData.accessory_purity
                : '–'}
            </div>
          ) : (
            <FormSelect
              value={formData.accessory_purity}
              onChange={(v) => handleChange('accessory_purity', v)}
              options={accessoryPurityOptions}
              placeholder="Select Accessory Purity"
              isDarkMode={isDarkMode}
            />
          )}
        </div>

        <div>
          <label className={labelClass}>Wire Size</label>
          {readOnly ? (
            <div className={readOnlyClass}>
              {formData.wire_size ? wireSizeOptions.find((o) => o.value === formData.wire_size)?.label ?? formData.wire_size : '–'}
            </div>
          ) : (
            <FormSelect
              value={formData.wire_size}
              onChange={(v) => handleChange('wire_size', v)}
              options={wireSizeOptions}
              placeholder="Select Wire Size"
              isDarkMode={isDarkMode}
            />
          )}
        </div>

        <div>
          <label className={labelClass}>Thickness</label>
          {readOnly ? (
            <div className={readOnlyClass}>
              {formData.thickness ? thicknessOptions.find((o) => o.value === formData.thickness)?.label ?? formData.thickness : '–'}
            </div>
          ) : (
            <FormSelect
              value={formData.thickness}
              onChange={(v) => handleChange('thickness', v)}
              options={thicknessOptions}
              placeholder="Select Thickness"
              isDarkMode={isDarkMode}
            />
          )}
        </div>

        <div>
          <label className={labelClass}>Design Name</label>
          {readOnly ? (
            <div className={readOnlyClass}>
              {formData.design_name ? designOptions.find((o) => o.value === formData.design_name)?.label ?? formData.design_name : '–'}
            </div>
          ) : (
            <FormSelect
              value={formData.design_name}
              onChange={(v) => handleChange('design_name', v)}
              options={designOptions}
              placeholder="Select Design"
              isDarkMode={isDarkMode}
            />
          )}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => handleTextChange('description', e.target.value, MAX_TEXT_FIELD_LENGTH)}
            placeholder="Enter description"
            maxLength={MAX_TEXT_FIELD_LENGTH}
            className={inputClass('description')}
            disabled={readOnly}
          />
          {errors.description && <p className={`mt-1 ${errorClass}`}>{errors.description}</p>}
        </div>
      </div>
    </div>
  );

  // Handler to fill weight details from metal pool balance
  const handleFillWeightDetails = () => {
    if (metalPoolBalance.length === 0) return;
    
    // Create weight detail entries from metal pool balance
    const newWeightDetails = metalPoolBalance.map((balance) => ({
      ...emptyWeightDetail,
      selected_purity: balance.purity,
      purity_percentage: String(balance.purity_percentage.toFixed(2)),
      selected_weight: '', // User needs to enter weight
    }));
    
    setFormData((prev) => ({
      ...prev,
      weight_details: newWeightDetails,
    }));
    setShowWeightDetails(true);
  };

  // Section 2: Metal Pool Balance (table with Weight input)
  const metalPoolSection = (
    <div className={sectionClass}>
      <h3
        className={`text-lg font-semibold mb-4 pb-2 border-b ${
          isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
        }`}
      >
        Metal Pool Balance
      </h3>
      {metalPoolLoading ? (
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading metal pool balance...
        </div>
      ) : metalPoolBalance.length === 0 ? (
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No metal pool balance available
        </div>
      ) : (
        <div>
          <div
            className={`overflow-x-auto rounded-lg border ${
              isDarkMode ? 'border-gray-600' : 'border-gray-300'
            }`}
          >
            <table className="min-w-full">
              <thead>
                <tr className={isDarkMode ? 'bg-gray-700' : 'bg-[#F2EFE9]'}>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r ${
                    isDarkMode ? 'text-gray-200 border-gray-500' : 'text-gray-800 border-gray-200'
                  }`}>
                    Sr.No.
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r ${
                    isDarkMode ? 'text-gray-200 border-gray-500' : 'text-gray-800 border-gray-200'
                  }`}>
                    Weight
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r ${
                    isDarkMode ? 'text-gray-200 border-gray-500' : 'text-gray-800 border-gray-200'
                  }`}>
                    Purity
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r ${
                    isDarkMode ? 'text-gray-200 border-gray-500' : 'text-gray-800 border-gray-200'
                  }`}>
                    Purity %
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r ${
                    isDarkMode ? 'text-gray-200 border-gray-500' : 'text-gray-800 border-gray-200'
                  }`}>
                    Balance Weight
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Total Fine Weight
                  </th>
                </tr>
              </thead>
              <tbody className={isDarkMode ? 'divide-y divide-gray-600' : 'divide-y divide-gray-200'}>
                {metalPoolBalance.map((balance, index) => (
                  <tr key={balance.purity} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                    <td className={`px-4 py-3 text-sm text-center font-medium border-r ${
                      isDarkMode ? 'text-gray-300 border-gray-500' : 'text-gray-700 border-gray-300'
                    }`}>
                      {index + 1}
                    </td>
                    <td className={`px-4 py-3 text-sm border-r ${
                      isDarkMode ? 'border-gray-500' : 'border-gray-300'
                    }`}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={metalPoolWeights[balance.purity] || ''}
                        onChange={(e) => handleMetalPoolWeightChange(balance.purity, e.target.value)}
                        onKeyDown={handleMetalPoolWeightKeyDown}
                        onPaste={(e) => handleMetalPoolWeightPaste(balance.purity, e)}
                        placeholder="Enter weight"
                        className={`w-full px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 ${
                          metalPoolWeightErrors[balance.purity]
                            ? 'border-red-500 focus:ring-red-500/30'
                            : 'focus:ring-blue-500'
                        } ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400'
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {metalPoolWeightErrors[balance.purity] && (
                        <p className={`mt-1 ${errorClass}`}>
                          {metalPoolWeightErrors[balance.purity]}
                        </p>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium border-r ${
                      isDarkMode ? 'text-gray-200 border-gray-500' : 'text-gray-900 border-gray-300'
                    }`}>
                      {balance.purity}
                    </td>
                    <td className={`px-4 py-3 text-sm border-r ${
                      isDarkMode ? 'text-gray-300 border-gray-500' : 'text-gray-700 border-gray-300'
                    }`}>
                      {balance.purity_percentage.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-sm border-r ${
                      isDarkMode ? 'text-gray-300 border-gray-500' : 'text-gray-700 border-gray-300'
                    }`}>
                      {balance.balance_weight.toFixed(4)}
                    </td>
                    <td className={`px-4 py-3 text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {balance.total_fine_weight.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleAddWeightDetails}
              disabled={metalPoolLoading || metalPoolBalance.length === 0}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm ${
                metalPoolLoading || metalPoolBalance.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              + Add Weight Details
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Section 3: Weight Details - editable description column
  const weightDetailsSection = (
    <div className={sectionClass}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Weight Details
        </h3>
      </div>

      {formData.weight_details.length > 0 ? (
        <EditableWeightTable<WeightDetail>
          columns={weightDetailColumns}
          data={formData.weight_details}
          readOnly={readOnly}
          showAddButton={false}
          showTotals={false}
          onDeleteRow={readOnly ? undefined : handleDeleteWeightDetail}
          onDataChange={
            readOnly
              ? undefined
              : (rows) =>
                  setFormData((prev) => ({
                    ...prev,
                    weight_details: rows,
                  }))
          }
        />
      ) : (
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No weight details added. Add weights in Metal Pool Balance table above.
        </div>
      )}
    </div>
  );

  // Calculate totals from weight details
  const calculateTotals = () => {
    let totalMetalWeight = 0;
    let totalFineWeight = 0;
    let totalAlloyWeight = 0;
    
    formData.weight_details.forEach(detail => {
      const weight = toNum(detail.selected_weight);
      const fineWeight = toNum(detail.fine_weight);
      const alloyWeight = toNum(detail.alloy_weight);
      
      totalMetalWeight += weight;
      totalFineWeight += fineWeight;
      totalAlloyWeight += alloyWeight;
    });
    
    return { totalMetalWeight, totalFineWeight, totalAlloyWeight };
  };
  
  const totals = calculateTotals();
  const totalAlloyVadotarNum = toNum(formData.total_alloy_vadotar);
  const totalGrossWeight = totals.totalMetalWeight + totalAlloyVadotarNum;

  // Section 4: Weight Details Totals - with total_alloy_vadotar as editable
  const weightDetailsTotalsSection = (
    <div className={sectionClass}>
      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Weight Details Totals
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
        <div>
          <label className={labelClass}>Total Metal Weight</label>
          <div className={readOnlyClass}>
            {totals.totalMetalWeight > 0 ? totals.totalMetalWeight.toFixed(4) : '–'}
          </div>
        </div>
        <div>
          <label className={labelClass}>Total Fine Weight</label>
          <div className={readOnlyClass}>
            {totals.totalFineWeight > 0 ? totals.totalFineWeight.toFixed(4) : '–'}
          </div>
        </div>
        <div>
          <label className={labelClass}>Total Alloy Weight</label>
          <div className={readOnlyClass}>
            {totals.totalAlloyWeight > 0 ? totals.totalAlloyWeight.toFixed(4) : '–'}
          </div>
        </div>
        <div>
          <label className={labelClass}>Total Gross Weight</label>
          <div className={readOnlyClass}>
            {totalGrossWeight > 0 ? totalGrossWeight.toFixed(4) : '–'}
          </div>
        </div>
        <div>
          <label className={labelClass}>Total Alloy Vadotar</label>
          {readOnly ? (
            <div className={readOnlyClass}>
              {formData.total_alloy_vadotar || '–'}
            </div>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              value={formData.total_alloy_vadotar}
              onChange={(e) => handleTextChange('total_alloy_vadotar', e.target.value, MAX_TEXT_FIELD_LENGTH)}
              onKeyDown={handleTotalAlloyVadotarKeyDown}
              onPaste={handleTotalAlloyVadotarPaste}
              placeholder="Enter Vadotar"
              className={inputClass('total_alloy_vadotar')}
            />
          )}
          {errors.total_alloy_vadotar && (
            <p className={`mt-1 ${errorClass}`}>{errors.total_alloy_vadotar}</p>
          )}
        </div>
      </div>
    </div>
  );

  const fields = <>{formFieldsSection}{metalPoolSection}{weightDetailsSection}{weightDetailsTotalsSection}</>;

  const actions = showActions && (
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
        {submitLoading ? 'Saving...' : isEdit ? 'Update Melting Lot' : 'Create Melting Lot'}
      </button>
    </div>
  );

  if (wrapInForm) {
    return (
      <form className="space-y-6">
        {fields}
        {actions}
      </form>
    );
  }

  return <div className="space-y-6">{fields}</div>;
});

export default MeltingLotFormInner;
