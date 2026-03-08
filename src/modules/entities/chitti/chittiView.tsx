import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, getEntityReferenceOptions } from '../../admin/admin.api';
import { showErrorToastUnlessAuth, isNotFoundErrorOrMessage, isNotFoundResponse } from '../../../shared/utils/errorHandling';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { useUIStore } from '../../../stores/ui.store';
import ChittiForm, { type ChittiFormData } from './chittiForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import ViewPageActionBar from '../../../shared/components/ViewPageActionBar';
import type { ViewPageAction } from '../../../shared/components/ViewPageActions';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import { useEntityDelete } from '../../../shared/hooks/useEntityDelete';
import { submitChitti } from './chitti.api';
import { toast } from '../../../stores/toast.store';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_DEFAULT, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';
import { invalidateEntityListCache } from '../../admin/admin.api';

const ENTITY_NAME = 'chitti';

function toInitialChittiData(entity: Record<string, unknown>): Partial<ChittiFormData> {
  const tx = entity.transaction_type;
  const transaction_type =
    tx === 'LABOUR' || tx === 'Labour' ? 'Labour' : tx === 'PURCHASE' || tx === 'Purchase' ? 'Purchase' : 'Labour';
  const material_issues = Array.isArray(entity.material_issues)
    ? (entity.material_issues as { material_issue?: string; voucher_no?: string }[])
        .map((m) => m.material_issue ?? m.voucher_no ?? '')
        .filter(Boolean)
    : [];
  return {
    customer: entity.customer != null ? String(entity.customer) : '',
    transaction_type,
    purity: entity.purity != null ? String(entity.purity) : '',
    material_issues,
  };
}

type MaterialIssueRow = {
  material_issue?: string;
  voucher_no?: string;
  id?: string;
  created_at?: string;
  modified_at?: string;
};

export default function ChittiViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [initialData, setInitialData] = useState<Partial<ChittiFormData> | undefined>(undefined);
  const [rawEntity, setRawEntity] = useState<Record<string, unknown> | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitSubmitting, setSubmitSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);
  const [purityOptions, setPurityOptions] = useState<{ value: string; label: string }[]>([]);

  const { deleteById, deletingId } = useEntityDelete(ENTITY_NAME);
  const isDeleting = id != null && deletingId === id;
  const status = rawEntity ? String(rawEntity.status ?? '') : '';
  const isDraft = status === 'Draft';

  const loadData = useCallback(() => {
    if (!id) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, id)
      .then((res) => {
        if (isNotFoundResponse(res)) {
          setNotFound(true);
          return;
        }
        const raw = res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {};
        const inner =
          raw.data && typeof raw.data === 'object' ? (raw.data as Record<string, unknown>) : raw;
        setRawEntity(inner);
        setInitialData(toInitialChittiData(inner));
      })
      .catch((err) => {
        if (isNotFoundErrorOrMessage(err)) {
          setNotFound(true);
          return;
        }
        const msg = err instanceof Error ? err.message : 'Failed to load chitti';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getEntityReferenceOptions('customer', 'customer_name', 'customer_name'),
      getEntityReferenceOptions('purity', 'purity', 'purity'),
    ])
      .then(([customers, purities]) => {
        if (ignore) return;
        setCustomerOptions(customers);
        setPurityOptions(purities);
      })
      .catch(() => {
        if (!ignore) {
          setCustomerOptions([]);
          setPurityOptions([]);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const handleSubmitChitti = useCallback(async () => {
    if (!id) return;
    setSubmitSubmitting(true);
    try {
      await submitChitti(id);
      toast.success('Chitti submitted successfully.');
      invalidateEntityListCache(ENTITY_NAME);
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit chitti';
      showErrorToastUnlessAuth(msg);
    } finally {
      setSubmitSubmitting(false);
    }
  }, [id, loadData]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!id) return;
    await deleteById(id, entityConfig.displayName);
    setShowDeleteDialog(false);
    navigate(entityConfig.routes.list);
  }, [id, deleteById, entityConfig.displayName, entityConfig.routes.list, navigate]);

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);

  const editUrl =
    isDraft && entityConfig.routes.edit
      ? entityConfig.routes.edit.replace(':id', encodeURIComponent(id ?? ''))
      : '';

  if (!id) {
    return (
      <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_INVALID_URL }} replace />
    );
  }

  if (notFound) {
    return (
      <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_DEFAULT }} replace />
    );
  }

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading chitti...
          </p>
        </div>
      </div>
    );
  }

  const displayName =
    rawEntity?.chitti_name != null ? String(rawEntity.chitti_name) : id;
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, displayName);
  const materialIssues: MaterialIssueRow[] = Array.isArray(rawEntity?.material_issues)
    ? (rawEntity.material_issues as MaterialIssueRow[])
    : [];

  const viewActions: ViewPageAction[] = [];
  if (isDraft) {
    if (editUrl) viewActions.push({ label: 'Edit', href: editUrl });
    viewActions.push({
      label: 'Submit',
      onClick: handleSubmitChitti,
      disabled: submitSubmitting,
    });
  }
  viewActions.push({
    label: 'Delete',
    onClick: () => setShowDeleteDialog(true),
    variant: 'danger',
    disabled: isDeleting,
  });

  const borderClass = isDarkMode ? 'border-gray-600' : 'border-gray-200';

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
          { label: breadcrumbLabel },
        ]}
        className="mb-4"
      />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {getViewPageHeading(entityConfig, displayName)}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {getViewPageDescription(entityConfig)}
          </p>
        </div>
        <ViewPageActionBar onBack={handleBack} actions={viewActions} isDarkMode={isDarkMode} />
      </div>
      <div
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={sectionClass}>
          <h2
            className={`text-lg font-semibold mb-4 pb-2 border-b ${borderClass} ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {entityConfig.displayName} Info
          </h2>
          <ChittiForm
            initialData={initialData}
            customerOptions={customerOptions}
            purityOptions={purityOptions}
            availableIssuesOptions={[]}
            showMaterialIssuesField={false}
            isEdit
            readOnly
            wrapInForm={false}
            showActions={false}
          />
        </div>

        {materialIssues.length > 0 ? (
          <div className={`mt-6 ${sectionClass}`}>
            <h2
              className={`text-lg font-semibold mb-4 pb-2 border-b ${borderClass} ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Material issues
            </h2>
            <div className="overflow-x-auto">
              <table className={`w-full text-sm border-collapse ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                <thead>
                  <tr className={`border-b ${borderClass}`}>
                    <th className="text-left py-2 px-3 font-semibold">Voucher / Material issue</th>
                    <th className="text-left py-2 px-3 font-semibold">ID</th>
                    <th className="text-left py-2 px-3 font-semibold">Created</th>
                    <th className="text-left py-2 px-3 font-semibold">Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {materialIssues.map((row, idx) => (
                    <tr key={idx} className={`border-b ${borderClass}`}>
                      <td className="py-2 px-3">{row.material_issue ?? row.voucher_no ?? '–'}</td>
                      <td className="py-2 px-3">{row.id != null ? String(row.id) : '–'}</td>
                      <td className="py-2 px-3">{row.created_at != null ? String(row.created_at) : '–'}</td>
                      <td className="py-2 px-3">{row.modified_at != null ? String(row.modified_at) : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`mt-6 ${sectionClass}`}>
            <h2
              className={`text-lg font-semibold mb-4 pb-2 border-b ${borderClass} ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Material issues
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No material issues.</p>
          </div>
        )}

        <AuditTrailsCard entity={rawEntity} asSection />
      </div>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${entityConfig.displayName}`}
        message={`Are you sure you want to delete this ${entityConfig.displayName.toLowerCase()}? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
