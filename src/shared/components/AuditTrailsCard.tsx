import { useUIStore } from '../../stores/ui.store';
import { formatDateTime } from '../utils/dateUtils';

const EMPTY = '—';

function valueOrEmpty(val: unknown): string {
  if (val === null || val === undefined) return EMPTY;
  const s = String(val).trim();
  return s ? s : EMPTY;
}

export interface AuditTrailsCardProps {
  entity?: Record<string, unknown> | null;
  /** When true, render as a section inside another card (no outer card wrapper). */
  asSection?: boolean;
}

export default function AuditTrailsCard({ entity, asSection = false }: AuditTrailsCardProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const createdBy = entity ? valueOrEmpty(entity.created_by) : EMPTY;
  const modifiedBy = entity ? valueOrEmpty(entity.modified_by) : EMPTY;
  const createdAt = entity ? formatDateTime(entity.created_at as string | number | null | undefined) : EMPTY;
  const modifiedAt = entity ? formatDateTime(entity.modified_at as string | number | null | undefined) : EMPTY;

  const labelCls = `block text-sm font-normal mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
  const valueBoxCls = `w-full px-4 py-2.5 text-sm rounded-lg border leading-relaxed ${
    isDarkMode
      ? 'bg-gray-700/50 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  const content = (
    <>
      <h2
        className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      >
        Audit Trails
      </h2>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 sm:gap-x-10">
        <div>
          <p className={labelCls}>Created By</p>
          <div className={valueBoxCls}>{createdBy}</div>
        </div>
        <div>
          <p className={labelCls}>Created At</p>
          <div className={valueBoxCls}>{createdAt}</div>
        </div>
        <div>
          <p className={labelCls}>Modified By</p>
          <div className={valueBoxCls}>{modifiedBy}</div>
        </div>
        <div>
          <p className={labelCls}>Modified At</p>
          <div className={valueBoxCls}>{modifiedAt}</div>
        </div>
      </div>
    </>
  );

  if (asSection) {
    return (
      <section className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        {content}
      </section>
    );
  }

  return (
    <div
      className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
    >
      {content}
    </div>
  );
}
