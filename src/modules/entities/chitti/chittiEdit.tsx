import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig, getRedirectToViewAfterEditUrl } from '../../../config/entity.config';
import { getEntity, updateEntity } from '../../admin/admin.api';
import { getEntityReferences, mapReferenceItemsToOptions } from '../../admin/admin.api';
import { getAvailableIssues } from './chitti.api';
import { getRedirectIdAfterUpdate } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth, isNotFoundErrorOrMessage, isNotFoundResponse } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import ChittiForm, { type ChittiFormData, type ChittiFormOption } from './chittiForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toChittiPayload } from './chittiCreate';
import {
  getEditPageTitle,
  getEditBreadcrumbLabel,
  getEditPageDescription,
} from '../../../shared/utils/entityPageLabels';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_DEFAULT, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'chitti';

function toInitialChittiData(entity: Record<string, unknown>): Partial<ChittiFormData> {
  const tx = entity.transaction_type;
  const transaction_type =
    tx === 'LABOUR' || tx === 'Labour' ? 'Labour' : tx === 'PURCHASE' || tx === 'Purchase' ? 'Purchase' : 'Labour';
  const material_issues = Array.isArray(entity.material_issues)
    ? (entity.material_issues as { material_issue?: string; voucher_no?: string }[]).map(
        (m) => m.material_issue ?? m.voucher_no ?? ''
      ).filter(Boolean)
    : [];
  return {
    customer: entity.customer != null ? String(entity.customer) : '',
    transaction_type,
    purity: entity.purity != null ? String(entity.purity) : '',
    material_issues,
  };
}

export default function ChittiEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [initialData, setInitialData] = useState<Partial<ChittiFormData> | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<ChittiFormOption[]>([]);
  const [purityOptions, setPurityOptions] = useState<ChittiFormOption[]>([]);
  const [availableIssuesOptions, setAvailableIssuesOptions] = useState<ChittiFormOption[]>([]);
  const [status, setStatus] = useState<string>('');
  const formRef = useRef<{ getData: () => ChittiFormData; validate: () => boolean } | null>(null);

  useEffect(() => {
    getEntityReferences('customer').then((items) => {
      const opts = mapReferenceItemsToOptions(items, 'customer_name', 'customer_name');
      setCustomerOptions(opts.length > 0 ? opts : items.map((row: Record<string, unknown>) => ({
        value: String(row.customer_name ?? ''),
        label: String(row.customer_name ?? ''),
      })));
    });
    getEntityReferences('purity').then((items) => {
      const opts = mapReferenceItemsToOptions(items, 'purity', 'purity');
      setPurityOptions(opts.length > 0 ? opts : items.map((row: Record<string, unknown>) => ({
        value: String(row.purity ?? ''),
        label: String(row.purity ?? ''),
      })));
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, id)
      .then((res) => {
        if (isNotFoundResponse(res)) {
          setNotFound(true);
          return;
        }
        const raw = res.data && typeof res.data === 'object' ? (res.data as Record<string, unknown>) : {};
        const inner = raw.data && typeof raw.data === 'object' ? (raw.data as Record<string, unknown>) : raw;
        setStatus(String(inner.status ?? ''));
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

  const [customer, setCustomer] = useState('');
  const [purity, setPurity] = useState('');
  const [transactionType, setTransactionType] = useState<'Labour' | 'Purchase'>('Labour');

  useEffect(() => {
    if (!customer.trim() || !purity.trim()) {
      setAvailableIssuesOptions([]);
      return;
    }
    getAvailableIssues({ customer, purity, transaction_type: transactionType, chitti_name: id })
      .then((rows) => {
        setAvailableIssuesOptions(rows.map((r) => ({ value: r.voucher_no, label: r.voucher_no })));
      })
      .catch(() => setAvailableIssuesOptions([]));
  }, [customer, purity, transactionType, id]);

  useEffect(() => {
    if (initialData) {
      setCustomer(initialData.customer ?? '');
      setPurity(initialData.purity ?? '');
      setTransactionType(initialData.transaction_type ?? 'Labour');
    }
  }, [initialData]);

  const handleSubmit = useCallback(
    async (formData: ChittiFormData) => {
      if (!id) return;
      setSubmitLoading(true);
      try {
        const res = await updateEntity(ENTITY_NAME, id, toChittiPayload(formData));
        toast.success(`${entityConfig.displayName} updated successfully.`);
        const newId = getRedirectIdAfterUpdate(res, formData as Record<string, unknown>, id, [
          'chitti_name',
          'id',
        ]);
        navigate(getRedirectToViewAfterEditUrl(ENTITY_NAME, newId));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Request failed';
        showErrorToastUnlessAuth(msg);
      } finally {
        setSubmitLoading(false);
      }
    },
    [id, navigate, entityConfig]
  );

  const handleCancel = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (formRef.current?.validate()) handleSubmit(formRef.current.getData());
    },
    [handleSubmit]
  );

  const handleFilterChange = useCallback(
    (params: { customer: string; purity: string; transaction_type: 'Labour' | 'Purchase' }) => {
      setCustomer(params.customer);
      setPurity(params.purity);
      setTransactionType(params.transaction_type);
    },
    []
  );

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);

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

  if (status !== 'Draft') {
    const detailUrl = entityConfig.routes.detail.replace(':id', encodeURIComponent(id));
    return <Navigate to={detailUrl} replace />;
  }

  const breadcrumbLabel = getEditBreadcrumbLabel(entityConfig, initialData?.customer);

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
      <div className="mb-6">
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {getEditPageTitle(entityConfig)}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {getEditPageDescription(entityConfig)}
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={sectionClass}>
          <ChittiForm
            ref={formRef}
            initialData={initialData}
            customerOptions={customerOptions}
            purityOptions={purityOptions}
            availableIssuesOptions={availableIssuesOptions}
            onFilterChange={handleFilterChange}
            isEdit
            wrapInForm={false}
            showActions={false}
          />
          <div className="flex items-center justify-end gap-3 pt-6 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:opacity-60`}
            >
              {submitLoading ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
