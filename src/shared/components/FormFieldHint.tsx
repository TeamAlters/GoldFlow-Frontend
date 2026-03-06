import { useUIStore } from '../../stores/ui.store';

export interface FormFieldHintProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Hint text shown below form inputs (e.g. "Enter text, max 32 characters").
 * Use with getTextInputDescription / getIntegerInputDescription / getDecimalInputDescription from formValidation.
 */
export function FormFieldHint({ children, className = '' }: FormFieldHintProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  return (
    <p
      className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${className}`.trim()}
    >
      {children}
    </p>
  );
}
