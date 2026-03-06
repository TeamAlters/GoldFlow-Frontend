import { useState, useRef, useEffect } from 'react';
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
}

/**
 * Custom dropdown that truncates long option text with ellipsis (native select does not).
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
}: FormSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);

  const selectedLabel = value ? options.find((o) => o.value === value)?.label ?? value : '';

  if (disabled && navigateTo && selectedLabel) {
    return (
      <div className={`w-full min-h-[42px] px-4 py-2.5 flex items-center text-sm rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
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
      const inMenu = usePortal ? menuRef.current?.contains(target) : false;
      if (!inTrigger && !inMenu) {
        setOpen(false);
      }
    };
    const handleScroll = () => {
      if (usePortal) setOpen(false);
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

  const menuBaseClass = `py-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto scrollbar-hide ${isDarkMode
      ? 'bg-gray-700 border-gray-600'
      : 'bg-white border-gray-200'
    }`;

  const renderMenuContent = () => (
    <>
      <li
        role="option"
        aria-selected={value === ''}
        onClick={() => {
          onChange('');
          setOpen(false);
        }}
        className={`px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${value === ''
            ? isDarkMode
              ? 'bg-blue-600/30 text-white'
              : 'bg-blue-50 text-blue-900'
            : isDarkMode
              ? 'text-gray-200 hover:bg-gray-600'
              : 'text-gray-900 hover:bg-gray-100'
          }`}
      >
        {placeholder}
      </li>
      {options.map((opt) => (
        <li
          key={opt.value}
          role="option"
          aria-selected={value === opt.value}
          onClick={() => {
            onChange(opt.value);
            setOpen(false);
          }}
          className={`px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${value === opt.value
              ? isDarkMode
                ? 'bg-blue-600/30 text-white'
                : 'bg-blue-50 text-blue-900'
              : isDarkMode
                ? 'text-gray-200 hover:bg-gray-600'
                : 'text-gray-900 hover:bg-gray-100'
            }`}
          title={opt.label}
        >
          {opt.label}
        </li>
      ))}
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
        <ul
          ref={menuRef}
          className={menuBaseClass}
          role="listbox"
          style={style}
        >
          {renderMenuContent()}
        </ul>,
        document.body
      );
    }

    return (
      <ul
        ref={menuRef}
        className={`absolute z-[999] left-0 right-0 ${menuPositionClass} ${menuBaseClass}`}
        role="listbox"
      >
        {renderMenuContent()}
      </ul>
    );
  };

  return (
    <div ref={containerRef} className="relative min-w-0 max-w-full overflow-hidden">
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        title={selectedLabel || undefined}
        className={`w-full min-w-0 max-w-full overflow-hidden px-4 py-2.5 text-sm rounded-lg border-[1px] transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus:border-blue-500 text-left flex items-center justify-between gap-2 ${isDarkMode
            ? 'bg-gray-700 border-gray-600 text-gray-100'
            : 'bg-white border-gray-300 text-gray-900'
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
