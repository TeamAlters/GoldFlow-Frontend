import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareCheck, faSquareXmark } from '@fortawesome/free-solid-svg-icons';
import { useUIStore } from '../../stores/ui.store';

type BooleanCellIconProps = {
  value: boolean;
  className?: string;
};

/** Boolean cell icons that match site theme (dark/light and palette). */
export function BooleanCellIcon({ value, className = '' }: BooleanCellIconProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const trueClass =
    `${className || (isDarkMode ? 'text-green-400' : 'text-green-600')} text-lg`.trim();
  const falseClass =
    `${className || (isDarkMode ? 'text-gray-500' : 'text-gray-400')} text-lg`.trim();

  if (value) {
    return (
      <FontAwesomeIcon
        icon={faSquareCheck}
        className={trueClass}
        title="Yes"
        aria-label="Yes"
      />
    );
  }
  return (
    <FontAwesomeIcon
      icon={faSquareXmark}
      className={falseClass}
      title="No"
      aria-label="No"
    />
  );
}
