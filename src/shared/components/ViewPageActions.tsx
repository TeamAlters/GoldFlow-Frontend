import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export interface ViewPageAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface ViewPageActionsProps {
  actions: ViewPageAction[];
  isDarkMode: boolean;
}

export default function ViewPageActions({ actions, isDarkMode }: ViewPageActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (actions.length === 0) return null;

  const triggerClass = `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
    isDarkMode
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
  }`;

  const itemBaseClass = `block w-full px-4 py-2.5 text-left text-sm font-medium transition-colors last:border-b-0 no-underline ${
    isDarkMode
      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border-b border-gray-700'
      : 'bg-white text-gray-900 hover:bg-gray-50 border-b border-gray-100'
  }`;
  const itemDangerClass = isDarkMode
    ? 'text-red-400 hover:bg-red-500/10'
    : 'text-red-600 hover:bg-red-50';
  const buttonResetClass = 'appearance-none border-0 cursor-pointer';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Actions"
      >
        <span>Actions</span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 min-w-[14rem] rounded-xl shadow-lg border overflow-hidden z-50 py-1 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          role="menu"
        >
          {actions.map((action, index) => {
            const isDanger = action.variant === 'danger';
            const itemClass = [
              itemBaseClass,
              isDanger ? itemDangerClass : '',
            ].filter(Boolean).join(' ');

            if (action.href) {
              return (
                <Link
                  key={index}
                  to={action.href}
                  className={itemClass}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  action.onClick?.();
                  setOpen(false);
                }}
                disabled={action.disabled}
                className={`${buttonResetClass} ${itemClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                role="menuitem"
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
