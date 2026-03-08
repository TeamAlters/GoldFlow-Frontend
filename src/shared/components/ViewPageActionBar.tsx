import BackButton from './BackButton';
import ViewPageActions, { type ViewPageAction } from './ViewPageActions';

export interface ViewPageActionBarProps {
  onBack: () => void;
  actions: ViewPageAction[];
  isDarkMode: boolean;
}

/**
 * Wraps Back button and ViewPageActions (Edit, Delete, etc.) for entity view pages.
 * Use this on every view page so actions are shown in a consistent bar.
 */
export default function ViewPageActionBar({
  onBack,
  actions,
  isDarkMode,
}: ViewPageActionBarProps) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <BackButton onClick={onBack} />
      <ViewPageActions actions={actions} isDarkMode={isDarkMode} />
    </div>
  );
}
