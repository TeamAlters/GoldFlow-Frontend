import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, updateEntity, getEntityReferences, mapReferenceItemsToOptions } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { FormSelect } from '../../../shared/components/FormSelect';
import { MAX_NUMERIC_63_LENGTH, sanitizeNumeric63Input, validateNumeric63 } from '../../../shared/utils/formValidation';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toFromToAccessoryInitialData, toFromToAccessoryPayload } from './accessoriesPurityRangeCreate';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'accessories_purity_range';

function parseNum(s: string): number | null {
  const t = s.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function AccessoriesPurityRangeEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [accessoryPurity, setAccessoryPurity] = useState('');
  const [accessoryPurityOptions, setAccessoryPurityOptions] = useState<{ value: string; label: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    getEntityReferences('accessory_purity')
      .then((items) => setAccessoryPurityOptions(mapReferenceItemsToOptions(items, 'accessory_purity')))
      .catch(() => setAccessoryPurityOptions([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, decodeURIComponent(id))
      .then((res) => {
        if (res.data && typeof res.data === 'object') {
          const initial = toFromToAccessoryInitialData(res.data as Record<string, unknown>);
          setFromValue(initial.from_value);
          setToValue(initial.to_value);
          setAccessoryPurity(initial.accessory_purity);
        }
      })
      .catch(() => {
        showErrorToastUnlessAuth('Failed to load accessories purity range');
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (fromValue.trim() === '') next.from_value = 'From value is required';
    else {
      const err = validateNumeric63(fromValue, 'From value', { nonNegative: true });
      if (err) next.from_value = err;
    }
    if (toValue.trim() === '') next.to_value = 'To value is required';
    else {
      const err = validateNumeric63(toValue, 'To value', { nonNegative: true });
      if (err) next.to_value = err;
    }
    if (!accessoryPurity.trim()) next.accessory_purity = 'Accessory purity is required';
    if (!next.from_value && !next.to_value && fromValue.trim() && toValue.trim()) {
      const from = parseNum(fromValue);
      const to = parseNum(toValue);
      if (from !== null && to !== null && from > to)
        next.to_value = 'To value must be greater than or equal to from value';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [fromValue, toValue, accessoryPurity]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id || !validate()) return;
      setSubmitLoading(true);
      try {
        await updateEntity(
          ENTITY_NAME,
          decodeURIComponent(id),
          toFromToAccessoryPayload(fromValue, toValue, accessoryPurity)
        );
        toast.success(`${entityConfig.displayName} updated successfully.`);
        navigate(entityConfig.routes.list);
      } catch (err) {
        showErrorToastUnlessAuth(err instanceof Error ? err.message : 'Request failed');
      } finally {
        setSubmitLoading(false);
      }
    },
    [id, fromValue, toValue, accessoryPurity, navigate, entityConfig, validate]
  );

  const handleCancel = useCallback(() => navigate(entityConfig.routes.list), [navigate, entityConfig.routes.list]);

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);
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

  if (!id) return (
    <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_INVALID_URL }} replace />
  );

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading accessories purity range...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
          { label: 'Edit Accessories Purity Range' },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Edit
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Update from value, to value and accessory purity.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={sectionClass}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>
              From Value <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={fromValue}
              onChange={(e) => {
                setFromValue(sanitizeNumeric63Input(e.target.value));
                if (errors.from_value) setErrors((prev) => ({ ...prev, from_value: '' }));
              }}
              placeholder="e.g. 0.000"
              maxLength={MAX_NUMERIC_63_LENGTH}
              className={inputClass('from_value')}
            />
            {errors.from_value && <p className={`mt-1 ${errorClass}`}>{errors.from_value}</p>}
          </div>
          <div>
            <label className={labelClass}>
              To Value <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={toValue}
              onChange={(e) => {
                setToValue(sanitizeNumeric63Input(e.target.value));
                if (errors.to_value) setErrors((prev) => ({ ...prev, to_value: '' }));
              }}
              placeholder="e.g. 99.999"
              maxLength={MAX_NUMERIC_63_LENGTH}
              className={inputClass('to_value')}
            />
            {errors.to_value && <p className={`mt-1 ${errorClass}`}>{errors.to_value}</p>}
          </div>
          <div>
            <label className={labelClass}>
              Accessory Purity <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>*</span>
            </label>
            {accessoryPurityOptions.length > 0 ? (
              <FormSelect
                value={accessoryPurity}
                onChange={(v) => {
                  setAccessoryPurity(v);
                  if (errors.accessory_purity) setErrors((prev) => ({ ...prev, accessory_purity: '' }));
                }}
                options={accessoryPurityOptions}
                placeholder="Select accessory purity"
                className={inputClass('accessory_purity')}
                isDarkMode={isDarkMode}
              />
            ) : (
              <input
                type="text"
                value={accessoryPurity}
                onChange={(e) => {
                  setAccessoryPurity(e.target.value);
                  if (errors.accessory_purity) setErrors((prev) => ({ ...prev, accessory_purity: '' }));
                }}
                placeholder="Accessory purity"
                className={inputClass('accessory_purity')}
              />
            )}
            {errors.accessory_purity && (
              <p className={`mt-1 ${errorClass}`}>{errors.accessory_purity}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-6 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLoading}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} disabled:opacity-60`}
          >
            {submitLoading ? 'Saving...' : 'Update'}
          </button>
        </div>
        </div>
      </form>
    </div>
  );
}
