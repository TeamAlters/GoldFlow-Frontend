import { useUIStore } from '../../stores/ui.store';

export interface BackButtonProps {
  onClick: () => void;
  className?: string;
  'aria-label'?: string;
}

export default function BackButton({
  onClick,
  className = '',
  'aria-label': ariaLabel = 'Back',
}: BackButtonProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const buttonCls = `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm ${
    isDarkMode
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  } ${className}`.trim();

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonCls}
      aria-label={ariaLabel}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-5 h-5"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
          clipRule="evenodd"
        />
      </svg>
      <span>Back</span>
    </button>
  );
}
