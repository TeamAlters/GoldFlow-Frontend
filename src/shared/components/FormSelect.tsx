import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
}: FormSelectProps) {
  const [open, setOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const selectedLabel = value ? options.find((o) => o.value === value)?.label ?? value : '';

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    } else {
      setDropdownRect(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const dropdownList = open && dropdownRect && (
    <ul
      ref={dropdownRef}
      className={`fixed z-[9999] py-1 rounded-lg border shadow-lg max-h-60 overflow-auto min-w-0 ${
        isDarkMode
          ? 'bg-gray-700 border-gray-600'
          : 'bg-white border-gray-200'
      }`}
      style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, minWidth: dropdownRect.width }}
      role="listbox"
    >
          <li
            role="option"
            aria-selected={value === ''}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className={`px-4 py-2.5 text-sm cursor-pointer truncate ${
              value === ''
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
              className={`px-4 py-2.5 text-sm cursor-pointer truncate ${
                value === opt.value
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
    </ul>
  );

  return (
    <div ref={containerRef} className="relative min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 text-left flex items-center justify-between gap-2 min-w-0 ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate min-w-0">
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
      {dropdownList && createPortal(dropdownList, document.body)}
    </div>
  );
}
