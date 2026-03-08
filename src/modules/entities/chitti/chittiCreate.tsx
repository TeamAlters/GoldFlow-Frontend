import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity } from '../../admin/admin.api';
import { getEntityReferences, mapReferenceItemsToOptions } from '../../admin/admin.api';
import { getAvailableIssues } from './chitti.api';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import ChittiForm, { type ChittiFormData, type ChittiFormOption } from './chittiForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';

const ENTITY_NAME = 'chitti';

export function toChittiPayload(data: ChittiFormData): Record<string, unknown> {
  return {
    customer: data.customer.trim(),
    transaction_type: data.transaction_type,
    purity: data.purity.trim(),
    material_issues: data.material_issues?.length ? data.material_issues : [],
  };
}

export default function ChittiCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<ChittiFormOption[]>([]);
  const [purityOptions, setPurityOptions] = useState<ChittiFormOption[]>([]);
  const [availableIssuesOptions, setAvailableIssuesOptions] = useState<ChittiFormOption[]>([]);
  const [filter, setFilter] = useState({ customer: '', purity: '', transaction_type: 'Labour' as 'Labour' | 'Purchase' });
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
    if (!filter.customer.trim() || !filter.purity.trim()) {
      setAvailableIssuesOptions([]);
      return;
    }
    getAvailableIssues({
      customer: filter.customer,
      purity: filter.purity,
      transaction_type: filter.transaction_type,
    })
      .then((rows) => {
        setAvailableIssuesOptions(rows.map((r) => ({ value: r.voucher_no, label: r.voucher_no })));
      })
      .catch(() => setAvailableIssuesOptions([]));
  }, [filter.customer, filter.purity, filter.transaction_type]);

  const handleFilterChange = useCallback(
    (params: { customer: string; purity: string; transaction_type: 'Labour' | 'Purchase' }) => {
      setFilter(params);
    },
    []
  );

  const handleSubmit = useCallback(
    async (formData: ChittiFormData) => {
      setSubmitLoading(true);
      try {
        const payload = toChittiPayload(formData);
        const res = await createEntity(ENTITY_NAME, payload);
        toast.success(`${entityConfig.displayName} created successfully.`);
        const id = getCreatedEntityId(res, payload, ['chitti_name', 'id']);
        navigate(
          id != null
            ? entityConfig.routes.detail.replace(':id', encodeURIComponent(String(id)))
            : entityConfig.routes.list
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Request failed';
        showErrorToastUnlessAuth(msg);
      } finally {
        setSubmitLoading(false);
      }
    },
    [navigate, entityConfig]
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

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
          { label: `Add ${entityConfig.displayName}` },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Add {entityConfig.displayName}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Create a new chitti.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={sectionClass}>
          <ChittiForm
            ref={formRef}
            initialData={undefined}
            customerOptions={customerOptions}
            purityOptions={purityOptions}
            availableIssuesOptions={availableIssuesOptions}
            onFilterChange={handleFilterChange}
            isEdit={false}
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
              {submitLoading ? 'Saving...' : 'Create Chitti'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
