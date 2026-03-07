import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  isDarkMode?: boolean;
  /** When provided and the select is disabled, renders the value as a navigation link instead of a disabled button. */
  navigateTo?: string;
  /** Controls whether the dropdown opens below (default) or above the trigger button. */
  placement?: 'top' | 'bottom';
  /** When false, renders the dropdown in place (absolute). Default true so dropdowns are not clipped by overflow/scroll in tables or modals. */
  usePortal?: boolean;
  /** When true (default), show a search input to filter options by typing. Set false for very small lists. */
  searchable?: boolean;
}

/**
 * Reusable searchable dropdown. Type to filter options instantly.
 * Use across the app for all dropdowns – single component, zero repeated code per page.
 */
export function FormSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = '',
  isDarkMode = false,
  navigateTo,
  placement = 'bottom',
  usePortal = true,
  searchable = true,
}: FormSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedLabel = value ? options.find((o) => o.value === value)?.label ?? value : '';

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();
    return options.filter(
      (opt) =>
        (opt.label && opt.label.toLowerCase().includes(q)) ||
        (opt.value && opt.value.toLowerCase().includes(q))
    );
  }, [options, searchQuery, searchable]);

  // Reset search when dropdown closes; focus search when opens
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    } else if (searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [open, searchable]);

  if (disabled && navigateTo && selectedLabel) {
    return (
      <div className={`w-full min-h-[42px] px-4 py-2.5 flex items-center text-sm rounded-2xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <Link
          to={navigateTo}
          className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}
        >
          {selectedLabel}
        </Link>
      </div>
    );
  }

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = containerRef.current?.contains(target);
      const inMenu = menuRef.current?.contains(target);
      if (!inTrigger && !inMenu) {
        setOpen(false);
      }
    };
    const handleScroll = (e: Event) => {
      if (!usePortal) return;
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || containerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, usePortal]);

  const menuPositionClass =
    placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1';

  const menuBaseClass = `rounded-2xl border shadow-lg overflow-hidden flex flex-col max-h-72 min-h-0 ${isDarkMode
      ? 'bg-gray-700 border-gray-600'
      : 'bg-white border-gray-200'
    }`;

  const optionClass = (isSelected: boolean) =>
    `px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${isSelected
      ? isDarkMode
        ? 'bg-blue-600/30 text-white'
        : 'bg-blue-50 text-blue-900'
      : isDarkMode
        ? 'text-gray-200 hover:bg-gray-600'
        : 'text-gray-900 hover:bg-gray-100'
    }`;

  const renderMenuContent = () => (
    <>
      {searchable && (
        <div className={`p-2 border-b shrink-0 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
                searchInputRef.current?.blur();
              }
            }}
            placeholder="Type to filter..."
            className={`w-full px-3 py-2 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-blue-500/30 ${isDarkMode
              ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            aria-label="Filter options"
          />
        </div>
      )}
      <ul className="flex-1 py-1 min-h-0 max-h-60 overflow-y-auto overflow-x-hidden overscroll-contain" role="listbox">
        <li
          role="option"
          aria-selected={value === ''}
          onClick={() => {
            onChange('');
            setOpen(false);
          }}
          className={optionClass(value === '')}
        >
          {placeholder}
        </li>
        {filteredOptions.map((opt) => (
          <li
            key={opt.value}
            role="option"
            aria-selected={value === opt.value}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            className={optionClass(value === opt.value)}
            title={opt.label}
          >
            {opt.label}
          </li>
        ))}
        {searchable && searchQuery.trim() && filteredOptions.length === 0 && (
          <li className={`px-4 py-2.5 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No matches for &quot;{searchQuery}&quot;
          </li>
        )}
      </ul>
    </>
  );

  const renderMenu = () => {
    if (!open) return null;

    if (usePortal && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const isTop = placement === 'top';
      const top = isTop ? rect.top - 4 : rect.bottom + 4;
      const style: React.CSSProperties = {
        position: 'fixed',
        left: rect.left,
        top: isTop ? undefined : top,
        bottom: isTop ? window.innerHeight - rect.top + 4 : undefined,
        width: Math.max(rect.width, 280),
        minWidth: 280,
        zIndex: 9999,
      };

      return createPortal(
        <div ref={menuRef} className={menuBaseClass} style={style}>
          {renderMenuContent()}
        </div>,
        document.body
      );
    }

    return (
      <div
        ref={menuRef}
        className={`absolute z-[999] left-0 right-0 ${menuPositionClass} ${menuBaseClass}`}
      >
        {renderMenuContent()}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative min-w-0 max-w-full overflow-visible">
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        title={selectedLabel || undefined}
        className={`w-full min-w-0 max-w-full overflow-hidden px-4 py-2.5 text-sm rounded border transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-left flex items-center justify-between gap-2 ${isDarkMode
            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-400'
            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
          } ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate min-w-0 flex-1">
          {selectedLabel || <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{placeholder}</span>}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {renderMenu()}
    </div>
  );
}
