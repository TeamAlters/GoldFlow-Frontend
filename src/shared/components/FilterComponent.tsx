import { useState, useEffect, useMemo, useRef } from 'react';
import { useUIStore } from '../../stores/ui.store';
import type { TableColumn } from './DataTable';

export type FilterValue =
  | string
  | string[]
  | null
  | { operator: string; value: string | string[] | null };

export type FilterConfig = {
  key: string;
  label: string;
  dataType: 'string' | 'number' | 'select' | 'multi-select';
  fetchFrom?: string; // API route for fetching options (for "in" operator multi-select options)
  options?: Array<{ label: string; value: string }>; // Static options
  operators?: string[]; // e.g. ["=", "≠", "contains", "in", ...]; when set, show operator dropdown
  defaultOperator?: string; // default "contains"
};

export type FilterComponentConfig = {
  default: Record<string, FilterConfig>;
  addable?: Record<string, FilterConfig>;
};

export interface FilterComponentProps<T> {
  columns: TableColumn<T>[];
  config: FilterComponentConfig;
  onFilterChange: (filters: Record<string, FilterValue>) => void;
  initialFilters?: Record<string, FilterValue>;
  className?: string;
}

export default function FilterComponent<T extends Record<string, any>>({
  columns,
  config,
  onFilterChange,
  initialFilters,
  className = '',
}: FilterComponentProps<T>) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue>>({});
  const [addableFilters, setAddableFilters] = useState<Record<string, FilterValue>>({});
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [openSelectKey, setOpenSelectKey] = useState<string | null>(null);
  const [openOperatorKey, setOpenOperatorKey] = useState<string | null>(null);
  const selectDropdownRef = useRef<HTMLDivElement>(null);
  const operatorDropdownRef = useRef<HTMLDivElement>(null);
  const [apiOptions, setApiOptions] = useState<
    Record<string, Array<{ label: string; value: string }>>
  >({});

  // Get available column keys from table headers
  const availableColumnKeys = useMemo(() => {
    return columns.map((col) => col.key);
  }, [columns]);

  // Filter addable config to only include columns that exist in table headers
  const validAddableFilters = useMemo(() => {
    if (!config.addable) return {};

    const valid: Record<string, FilterConfig> = {};
    Object.entries(config.addable).forEach(([key, filterConfig]) => {
      if (availableColumnKeys.includes(key)) {
        valid[key] = filterConfig;
      }
    });
    return valid;
  }, [config.addable, availableColumnKeys]);

  // Fetch API options for filters that need them
  useEffect(() => {
    const fetchApiOptions = async () => {
      const fetchPromises: Promise<void>[] = [];

      // Fetch for default filters
      Object.entries(config.default).forEach(([key, filterConfig]) => {
        if (filterConfig.fetchFrom && !apiOptions[key]) {
          fetchPromises.push(
            fetch(filterConfig.fetchFrom)
              .then((res) => res.json())
              .then((data) => {
                // Transform API response to options format
                // Adjust this based on your API response structure
                const options = Array.isArray(data)
                  ? data.map((item: any) => ({
                    label: item.name || item.label || String(item),
                    value: item.id || item.value || String(item),
                  }))
                  : [];
                setApiOptions((prev) => ({ ...prev, [key]: options }));
              })
              .catch((err) => {
                console.error(`Error fetching options for ${key}:`, err);
                setApiOptions((prev) => ({ ...prev, [key]: [] }));
              })
          );
        }
      });

      // Fetch for addable filters
      Object.entries(validAddableFilters).forEach(([key, filterConfig]) => {
        if (filterConfig.fetchFrom && !apiOptions[key]) {
          fetchPromises.push(
            fetch(filterConfig.fetchFrom)
              .then((res) => res.json())
              .then((data) => {
                const options = Array.isArray(data)
                  ? data.map((item: any) => ({
                    label: item.name || item.label || String(item),
                    value: item.id || item.value || String(item),
                  }))
                  : [];
                setApiOptions((prev) => ({ ...prev, [key]: options }));
              })
              .catch((err) => {
                console.error(`Error fetching options for ${key}:`, err);
                setApiOptions((prev) => ({ ...prev, [key]: [] }));
              })
          );
        }
      });

      await Promise.all(fetchPromises);
    };

    fetchApiOptions();
  }, [config.default, validAddableFilters]);

  // Initialize filters with initial values or defaults
  useEffect(() => {
    const defaultFilters: Record<string, FilterValue> = {};
    const addableFiltersInit: Record<string, FilterValue> = {};

    // Initialize default filters from initialFilters or set to null / { operator, value }
    Object.entries(config.default).forEach(([key, filterConfig]) => {
      const initial = initialFilters?.[key];
      if (filterConfig.operators?.length) {
        defaultFilters[key] =
          initial !== null && typeof initial === 'object' && 'operator' in (initial as object)
            ? (initial as { operator: string; value: string | string[] | null })
            : { operator: filterConfig.defaultOperator ?? 'contains', value: null };
      } else {
        defaultFilters[key] = initial ?? null;
      }
    });

    // Initialize addable filters from initialFilters
    if (config.addable && initialFilters) {
      Object.keys(config.addable).forEach((key) => {
        if (initialFilters[key] !== undefined && !config.default[key]) {
          addableFiltersInit[key] = initialFilters[key];
        }
      });
    }

    setActiveFilters(defaultFilters);
    setAddableFilters(addableFiltersInit);
  }, [config.default, config.addable, initialFilters]);

  // Close select dropdown when clicking outside
  useEffect(() => {
    if (!openSelectKey) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (selectDropdownRef.current && !selectDropdownRef.current.contains(e.target as Node)) {
        setOpenSelectKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openSelectKey]);

  // Close operator dropdown when clicking outside
  useEffect(() => {
    if (!openOperatorKey) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (operatorDropdownRef.current && !operatorDropdownRef.current.contains(e.target as Node)) {
        setOpenOperatorKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openOperatorKey]);

  // Handle submit - apply filters (only include filters that have a value; skip null/empty)
  const handleSubmit = () => {
    const allFilters = { ...activeFilters, ...addableFilters };
    const onlyWithValues: Record<string, FilterValue> = {};
    Object.entries(allFilters).forEach(([k, val]) => {
      if (hasFilterValue(val)) onlyWithValues[k] = val;
    });
    if (Object.keys(onlyWithValues).length > 0) {
    }
    console.log('[GoldFlow] [FilterComponent] handleSubmit', { onlyWithValues });
    onFilterChange(onlyWithValues);
  };

  // Handle clear all filters (pass empty so no filter keys with null are sent)
  const handleClearAll = () => {
    const clearedDefaults: Record<string, FilterValue> = {};
    Object.entries(config.default).forEach(([key, filterConfig]) => {
      clearedDefaults[key] = filterConfig.operators?.length
        ? { operator: filterConfig.defaultOperator ?? 'contains', value: null }
        : null;
    });
    setActiveFilters(clearedDefaults);
    setAddableFilters({});
    onFilterChange({});
  };

  const handleFilterChange = (key: string, value: FilterValue, isAddable = false) => {
    if (isAddable) {
      setAddableFilters((prev) => ({ ...prev, [key]: value }));
    } else {
      setActiveFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const removeFilter = (key: string, isAddable = false) => {
    if (isAddable) {
      setAddableFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      });
    } else {
      setActiveFilters((prev) => ({ ...prev, [key]: null }));
    }
  };

  const addFilter = (key: string) => {
    const filterConfig = validAddableFilters[key];
    if (filterConfig) {
      const initial: FilterValue = filterConfig.operators?.length
        ? { operator: filterConfig.defaultOperator ?? 'contains', value: null }
        : null;
      setAddableFilters((prev) => ({ ...prev, [key]: initial }));
    }
  };

  const getFilterOptions = (filterConfig: FilterConfig, key: string) => {
    if (filterConfig.options) {
      return filterConfig.options;
    }
    if (filterConfig.fetchFrom && apiOptions[key]) {
      return apiOptions[key];
    }
    return [];
  };

  const hasFilterValue = (val: FilterValue): boolean => {
    if (val === null || val === '') return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object' && val !== null && 'value' in val)
      return hasFilterValue((val as { value: FilterValue }).value);
    return true;
  };

  const getOperatorAndValue = (
    val: FilterValue,
    defaultOp: string
  ): { operator: string; value: string | string[] | null } => {
    if (val !== null && typeof val === 'object' && 'operator' in val && 'value' in val) {
      const o = val as { operator: string; value: string | string[] | null };
      return { operator: o.operator, value: o.value };
    }
    return { operator: defaultOp, value: val as string | string[] | null };
  };

  const renderFilterInput = (key: string, filterConfig: FilterConfig, isAddable = false) => {
    const rawValue = isAddable ? addableFilters[key] : activeFilters[key];
    const options = getFilterOptions(filterConfig, key);

    // When filter has operators: render operator dropdown (left) + value input (right) in one bordered box
    if (filterConfig.operators?.length) {
      const defaultOp = filterConfig.defaultOperator ?? 'contains';
      const { operator, value } = getOperatorAndValue(rawValue, defaultOp);
      const inputBaseClasses = `px-3 py-2 text-sm border-0 focus:outline-none focus:ring-0 ${isDarkMode
        ? 'bg-transparent text-white placeholder-gray-500'
        : 'bg-transparent text-gray-900 placeholder-gray-400'
        }`;
      const borderClasses = `rounded-lg border flex ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`;

      const updateFilter = (newOperator: string, newValue: string | string[] | null) => {
        handleFilterChange(key, { operator: newOperator, value: newValue }, isAddable);
      };

      const operatorSelectId = `op-${isAddable ? 'addable-' : ''}${key}`;
      const isOperatorOpen = openOperatorKey === operatorSelectId;

      return (
        <div className={borderClasses}>
          {/* Operator dropdown - left section (custom styled); rounded left to match container */}
          <div
            ref={isOperatorOpen ? operatorDropdownRef : undefined}
            className="relative min-w-[7rem] max-w-[10rem] shrink-0 overflow-visible"
          >
            <button
              type="button"
              onClick={() => setOpenOperatorKey(isOperatorOpen ? null : operatorSelectId)}
              className={`w-full h-full min-h-[2.5rem] px-3 py-2 text-left text-sm border-r flex items-center justify-between gap-1 transition-colors rounded-l-lg ${isDarkMode
                ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600'
                : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                } ${isOperatorOpen ? (isDarkMode ? 'ring-inset ring-1 ring-blue-500/60 bg-gray-600' : 'ring-inset ring-1 ring-blue-400 bg-gray-50') : ''}`}
              aria-label={`Operator for ${filterConfig.label}`}
              aria-expanded={isOperatorOpen}
            >
              <span className="truncate">{operator}</span>
              <svg
                className={`w-4 h-4 shrink-0 transition-transform ${isOperatorOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isOperatorOpen && (
              <div
                className={`absolute left-0 top-full z-50 mt-1 min-w-full py-1 rounded-lg border shadow-xl ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                  }`}
              >
                {filterConfig.operators.map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => {
                      updateFilter(op, value);
                      setOpenOperatorKey(null);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm truncate transition-colors ${operator === op
                      ? isDarkMode
                        ? 'bg-blue-600/30 text-blue-300 font-medium'
                        : 'bg-blue-100 text-blue-800 font-medium'
                      : isDarkMode
                        ? 'text-gray-200 hover:bg-gray-700'
                        : 'text-gray-800 hover:bg-gray-100'
                      }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Value - right section: rounded right to match container */}
          <div className="flex-1 min-w-0 rounded-r-lg">
            {operator === 'in' ? (
              <div className="relative w-full">
                <select
                  multiple
                  value={Array.isArray(value) ? value : []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                    updateFilter(operator, selected.length > 0 ? selected : null);
                  }}
                  className={`w-full min-h-[2.5rem] ${inputBaseClasses}`}
                  size={Math.min(Math.max(options.length, 1) + 1, 5)}
                >
                  {options.length ? (
                    options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Select multiple (options load from API)
                    </option>
                  )}
                </select>
              </div>
            ) : (
              <input
                type="text"
                value={(value as string) ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  updateFilter(operator, v === '' ? null : v);
                }}
                placeholder={`Value for ${filterConfig.label}...`}
                className={`w-full h-full ${inputBaseClasses}`}
              />
            )}
          </div>
        </div>
      );
    }

    const value = rawValue;

    // Close dropdown when input is clicked
    const handleInputClick = () => {
      if (showAddFilter) {
        setShowAddFilter(false);
      }
    };

    const selectId = isAddable ? `addable-${key}` : key;
    const isSelectOpen = openSelectKey === selectId;
    const inputBaseClasses = `w-full px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${isDarkMode
      ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20'
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
      }`;

    switch (filterConfig.dataType) {
      case 'select': {
        const currentLabel = (value as string)
          ? (options.find((o) => o.value === value)?.label ?? (value as string))
          : `All ${filterConfig.label}`;
        return (
          <div
            ref={isSelectOpen ? selectDropdownRef : undefined}
            className="relative w-full min-w-0"
          >
            <button
              type="button"
              onClick={() => setOpenSelectKey(isSelectOpen ? null : selectId)}
              className={`${inputBaseClasses} flex items-center justify-between text-left appearance-none cursor-pointer ${isSelectOpen ? 'ring-2 ring-blue-500/30' : ''}`}
            >
              <span className={!value ? (isDarkMode ? 'text-gray-500' : 'text-gray-400') : ''}>
                {currentLabel}
              </span>
              <svg
                className={`w-4 h-4 shrink-0 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isSelectOpen && (
              <div
                className={`absolute left-0 right-0 top-full z-50 mt-1 py-1 rounded-lg border shadow-lg box-border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    handleFilterChange(key, null, isAddable);
                    setOpenSelectKey(null);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm ${isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                    } ${!value ? (isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700') : ''}`}
                >
                  All {filterConfig.label}
                </button>
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      handleFilterChange(key, option.value, isAddable);
                      setOpenSelectKey(null);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm ${isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                      } ${value === option.value ? (isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700') : ''}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'multi-select':
        const selectedValues = (value as string[]) || [];
        return (
          <select
            multiple
            value={selectedValues}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value);
              handleFilterChange(key, selected.length > 0 ? selected : null, isAddable);
            }}
            onClick={handleInputClick}
            className={`w-full px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500/20'
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            size={Math.min(options.length + 1, 5)}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'string':
      default:
        return (
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => {
              const newValue = e.target.value;
              handleFilterChange(key, newValue === '' ? null : newValue, isAddable);
            }}
            onClick={handleInputClick}
            onFocus={handleInputClick}
            placeholder={`Filter by ${filterConfig.label}...`}
            className={`w-full px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
          />
        );
    }
  };

  // Get available filters to add (excluding already added ones)
  const availableFiltersToAdd = useMemo(() => {
    return Object.entries(validAddableFilters).filter(
      ([key]) => !addableFilters.hasOwnProperty(key)
    );
  }, [validAddableFilters, addableFilters]);

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`rounded-lg border border-solid p-4 ${isDarkMode ? 'bg-gray-800 border-gray-500' : 'bg-white border-gray-300'}`}
      >
        {/* Default Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-xll font-bold tracking-tight ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Filters
            </h2>
            <div className="flex items-center gap-2">
              {availableFiltersToAdd.length > 0 && (
                <button
                  onClick={() => setShowAddFilter(!showAddFilter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                  <svg className="w-3 h-3g  " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <span>Add Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* Add Filter Dropdown */}
          {showAddFilter && availableFiltersToAdd.length > 0 && (
            <div
              className={`mb-4 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-300'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select one or more filters to add:
                </p>
                <button
                  onClick={() => setShowAddFilter(false)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  Done
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableFiltersToAdd.map(([key, filterConfig]) => (
                  <button
                    key={key}
                    onClick={() => addFilter(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                  >
                    + {filterConfig.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Default Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(config.default).map(([key, filterConfig]) => {
              const value = activeFilters[key];
              const hasValue = hasFilterValue(value);

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      {filterConfig.label}
                    </label>
                    {hasValue && (
                      <button
                        onClick={() => removeFilter(key, false)}
                        className={`text-xs ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {renderFilterInput(key, filterConfig, false)}
                </div>
              );
            })}

            {/* Addable Filters */}
            {Object.entries(addableFilters).map(([key]) => {
              const filterConfig = validAddableFilters[key];
              if (!filterConfig) return null;

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      {filterConfig.label}
                    </label>
                    <button
                      onClick={() => removeFilter(key, true)}
                      className={`text-xs ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                    >
                      Remove
                    </button>
                  </div>
                  {renderFilterInput(key, filterConfig, true)}
                </div>
              );
            })}
          </div>

          {/* Action Buttons (same size as Add Filter: px-3 py-1.5 text-xs) */}
          <div
            className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-end gap-2`}
          >
            <button
              onClick={handleClearAll}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
            >
              Clear Filters
            </button>
            <button
              onClick={handleSubmit}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
