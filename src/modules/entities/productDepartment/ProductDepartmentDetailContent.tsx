import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import type { ProductDepartmentFormData } from './productDepartmentForm';

const BOOLEAN_FIELDS = [
  'requires_issue',
  'requires_receive',
  'allows_loss',
  'is_optional',
  'allow_rework',
  'is_final_department',
  'allow_wastage',
  'allow_weight_changes',
  'approval_required',
  'show_delay_alert',
  'allow_weight_splits',
  'loss_requires_reason',
  'loss_approval_required',
] as const;

function formatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface ProductDepartmentDetailContentProps {
  data: Partial<ProductDepartmentFormData> | null;
}

/**
 * Reusable read-only display of Product Department details.
 * Renders Department Details + Configurations sections (no audit trails).
 * Use in view page or inside modals.
 */
export default function ProductDepartmentDetailContent({
  data,
}: ProductDepartmentDetailContentProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);

  const labelClass = `block text-sm font-normal mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
  const valueBoxClass = `w-full min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm leading-relaxed ${
    isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'
  }`;

  const sectionHeadingClass = `text-lg font-semibold mb-4 pb-2 border-b ${
    isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
  }`;

  if (!data) {
    return (
      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        No data to display.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Department Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
          <div>
            <p className={labelClass}>Product</p>
            <div className={valueBoxClass}>{data.product ?? '–'}</div>
          </div>
          <div>
            <p className={labelClass}>Department Group</p>
            <div className={valueBoxClass}>{data.department_group ?? '–'}</div>
          </div>
          <div>
            <p className={labelClass}>Department</p>
            <div className={valueBoxClass}>{data.department ?? '–'}</div>
          </div>
          <div>
            <p className={labelClass}>Step No</p>
            <div className={valueBoxClass}>{data.step_no ?? '–'}</div>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionHeadingClass}>Configurations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
          {BOOLEAN_FIELDS.map((key) => (
            <label key={key} className="flex items-center gap-2 cursor-default">
              <input
                type="checkbox"
                checked={Boolean(data[key])}
                disabled
                className={`rounded ${isDarkMode ? 'accent-blue-500' : 'accent-blue-600'}`}
              />
              <span
                className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                {formatLabel(key)}
              </span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-6">
          <div>
            <p className={labelClass}>Loss Percentage</p>
            <div className={valueBoxClass}>
              {data.loss_percentage != null && data.loss_percentage !== ''
                ? data.loss_percentage
                : '–'}
            </div>
          </div>
          <div>
            <p className={labelClass}>Expected Processing Time (mins)</p>
            <div className={valueBoxClass}>
              {data.expected_processing_time_mins != null &&
              data.expected_processing_time_mins !== ''
                ? data.expected_processing_time_mins
                : '–'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
