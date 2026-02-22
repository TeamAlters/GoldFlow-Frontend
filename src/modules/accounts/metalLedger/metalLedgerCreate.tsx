import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity } from '../../admin/admin.api';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import MetalLedgerForm, {
  type MetalLedgerFormData,
  type MetalLedgerFormRef,
} from './metalLedgerForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';

const ENTITY_NAME = 'metal_ledger';

/**
 * Convert form data to API payload
 * Only includes fields that should be sent to API for create operation
 */
export function toMetalLedgerPayload(data: MetalLedgerFormData): Record<string, unknown> {
  return {
    entry_type: data.entry_type,
    metal_type: data.metal_type,
    transaction_type: data.transaction_type,
    customer: data.customer,
    item_name: data.item_name,
    purity: data.purity,
    purity_percentage: data.purity_percentage ? parseFloat(data.purity_percentage) : null,
    total_purity: data.total_purity ? parseFloat(data.total_purity) : null,
    wastage: data.wastage ? parseFloat(data.wastage) : null,
    gross_weight: data.gross_weight ? parseFloat(data.gross_weight) : null,
    pure_weight: data.pure_weight ? parseFloat(data.pure_weight) : null,
    fine_weight: data.fine_weight ? parseFloat(data.fine_weight) : null,
    fine_weight_with_wastage: data.fine_weight_with_wastage ? parseFloat(data.fine_weight_with_wastage) : null,
    rate_cut_weight: data.rate_cut_weight ? parseFloat(data.rate_cut_weight) : null,
    hallmark_rate: data.hallmark_rate ? parseFloat(data.hallmark_rate) : null,
    hallmark_qty: data.hallmark_qty ? parseFloat(data.hallmark_qty) : null,
    hallmark_amount: data.hallmark_amount ? parseFloat(data.hallmark_amount) : null,
    stone_rate: data.stone_rate ? parseFloat(data.stone_rate) : null,
    stone_weight: data.stone_weight ? parseFloat(data.stone_weight) : null,
    stone_amount: data.stone_amount ? parseFloat(data.stone_amount) : null,
    gold_rate: data.gold_rate ? parseFloat(data.gold_rate) : null,
    amount: data.amount ? parseFloat(data.amount) : null,
    total_taxable_amount: data.total_taxable_amount ? parseFloat(data.total_taxable_amount) : null,
    sgst: data.sgst ? parseFloat(data.sgst) : null,
    cgst: data.cgst ? parseFloat(data.cgst) : null,
    final_amount: data.final_amount ? parseFloat(data.final_amount) : null,
    remarks: data.remarks || null,
  };
}

/**
 * Parse entity response to initial form data
 */
export function toInitialMetalLedgerData(entity: Record<string, unknown>): Partial<MetalLedgerFormData> {
  return {
    voucher_no: entity.voucher_no != null ? String(entity.voucher_no) : '',
    entry_type: entity.entry_type != null ? String(entity.entry_type) : 'RECEIPT',
    metal_type: entity.metal_type != null ? String(entity.metal_type) : 'GOLD',
    transaction_type: entity.transaction_type != null ? String(entity.transaction_type) : 'PURCHASE',
    transaction_date: entity.transaction_date != null ? String(entity.transaction_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    customer: entity.customer != null ? String(entity.customer) : '',
    item_name: entity.item_name != null ? String(entity.item_name) : '',
    purity: entity.purity != null ? String(entity.purity) : '',
    purity_percentage: entity.purity_percentage != null ? String(entity.purity_percentage) : '',
    total_purity: entity.total_purity != null ? String(entity.total_purity) : '',
    wastage: entity.wastage != null ? String(entity.wastage) : '',
    gross_weight: entity.gross_weight != null ? String(entity.gross_weight) : '',
    pure_weight: entity.pure_weight != null ? String(entity.pure_weight) : '',
    fine_weight: entity.fine_weight != null ? String(entity.fine_weight) : '',
    fine_weight_with_wastage: entity.fine_weight_with_wastage != null ? String(entity.fine_weight_with_wastage) : '',
    rate_cut_weight: entity.rate_cut_weight != null ? String(entity.rate_cut_weight) : '',
    hallmark_rate: entity.hallmark_rate != null ? String(entity.hallmark_rate) : '',
    hallmark_qty: entity.hallmark_qty != null ? String(entity.hallmark_qty) : '',
    hallmark_amount: entity.hallmark_amount != null ? String(entity.hallmark_amount) : '',
    stone_rate: entity.stone_rate != null ? String(entity.stone_rate) : '',
    stone_weight: entity.stone_weight != null ? String(entity.stone_weight) : '',
    stone_amount: entity.stone_amount != null ? String(entity.stone_amount) : '',
    gold_rate: entity.gold_rate != null ? String(entity.gold_rate) : '',
    amount: entity.amount != null ? String(entity.amount) : '',
    total_taxable_amount: entity.total_taxable_amount != null ? String(entity.total_taxable_amount) : '',
    sgst: entity.sgst != null ? String(entity.sgst) : '',
    cgst: entity.cgst != null ? String(entity.cgst) : '',
    final_amount: entity.final_amount != null ? String(entity.final_amount) : '',
    remarks: entity.remarks != null ? String(entity.remarks) : '',
    created_at: entity.created_at != null ? String(entity.created_at) : '',
    modified_at: entity.modified_at != null ? String(entity.modified_at) : '',
    created_by: entity.created_by != null ? String(entity.created_by) : '',
    modified_by: entity.modified_by != null ? String(entity.modified_by) : '',
  };
}

export default function MetalLedgerCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [submitLoading, setSubmitLoading] = useState(false);
  const metalLedgerFormRef = useRef<MetalLedgerFormRef>(null);

  const handleSubmit = useCallback(
    async (formData: MetalLedgerFormData) => {
      const payload = toMetalLedgerPayload(formData);
      setSubmitLoading(true);
      try {
        const res = await createEntity(ENTITY_NAME, payload);
        toast.success(`${entityConfig.displayName} created successfully.`);
        const id = getCreatedEntityId(res, payload as Record<string, unknown>, ['voucher_no', 'id']);
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
      if (metalLedgerFormRef.current?.validate()) {
        const formData = metalLedgerFormRef.current.getData();
        handleSubmit(formData);
      }
    },
    [handleSubmit]
  );

  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const breadcrumbLabel = `Add ${entityConfig.displayName}`;

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
          className={`text-2xl font-bold tracking-tight sm:text-3xl ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Create a new Metal Ledger
        </h1>
        <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Enter metal ledger details and save.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <MetalLedgerForm
          ref={metalLedgerFormRef}
          initialData={undefined}
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
            {submitLoading ? 'Saving...' : 'Create Metal Ledger'}
          </button>
        </div>
      </form>
    </div>
  );
}
