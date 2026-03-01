import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity } from '../../admin/admin.api';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getCreateEditViewPageWrapperClass } from '../../../shared/utils/viewPageStyles';
import MeltingLotForm, {
  type MeltingLotFormData,
  type MeltingLotFormRef,
  type WeightDetail,
} from './meltiingLotForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';

const ENTITY_NAME = 'melting_lot';

// Helper to parse string to number safely
function toNum(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : 0;
}

/**
 * Convert form data to API payload
 * Only includes fields that should be sent to API for create/update operation
 */
export function toMeltingLotPayload(data: MeltingLotFormData): Record<string, unknown> {
  // Get purity percentage from the form's purity selection
  const purityPercentage = data.purity ? toNum(data.purity_percentage) : 0;
  
  return {
    product: data.product || null,
    purity: data.purity || null,
    purity_percentage: purityPercentage > 0 ? purityPercentage : null,
    accessory_purity: data.accessory_purity || null,
    wire_size: data.wire_size || null,
    thickness: data.thickness || null,
    design_name: data.design_name || null,
    description: data.description || null,
    weight_details: data.weight_details
      ? data.weight_details
          .filter((d) => d.selected_weight && d.selected_purity)
          .map((d) => {
            const weight = toNum(d.selected_weight);
            const purityPct = toNum(d.purity_percentage);
            
            // Fine Weight = weight × purity_percentage / 100
            const fineWeight = weight > 0 && purityPct > 0 ? (weight * purityPct) / 100 : 0;
            
            // Alloy Weight = (Fine Weight / melting_lot_purity) * 100 - weight
            const alloyWeight = fineWeight > 0 && purityPercentage > 0 ? (fineWeight / purityPercentage) * 100 - weight : 0;
            
            return {
              // Include id only if it exists (for update), omit for new entries
              ...(d.id ? { id: d.id } : {}),
              selected_purity: d.selected_purity || null,
              selected_purity_percentage: purityPct > 0 ? purityPct : null,
              selected_weight: d.selected_weight ? parseFloat(d.selected_weight) : null,
              description: d.description || null,
            };
          })
      : [],
    // Weight details totals
    total_alloy_vadotar: data.total_alloy_vadotar ? parseFloat(data.total_alloy_vadotar) : null,
  };
}

/**
 * Parse entity response to initial form data
 */
export function toInitialMeltingLotData(
  entity: Record<string, unknown>
): Partial<MeltingLotFormData> {
  // Parse weight_details if present in entity
  let weightDetails: WeightDetail[] = [];
  if (Array.isArray(entity.weight_details)) {
    weightDetails = entity.weight_details.map((wd: Record<string, unknown>) => ({
      id: wd.id != null ? String(wd.id) : undefined,  // Include id for existing entries
      selected_weight: wd.selected_weight != null ? String(wd.selected_weight) : '',
      selected_purity: wd.selected_purity != null ? String(wd.selected_purity) : '',
      purity_percentage: wd.selected_purity_percentage != null ? String(wd.selected_purity_percentage) : '',
      fine_weight: wd.selected_fine_weight != null ? String(wd.selected_fine_weight) : '',
      alloy_weight: wd.selected_alloy_weight != null ? String(wd.selected_alloy_weight) : '',
      description: wd.description != null ? String(wd.description) : '',
    }));
  }

  return {
    product: entity.product != null ? String(entity.product) : '',
    purity: entity.purity != null ? String(entity.purity) : '',
    purity_percentage: entity.purity_percentage != null ? String(entity.purity_percentage) : '',
    accessory_purity: entity.accessory_purity != null ? String(entity.accessory_purity) : '',
    wire_size: entity.wire_size != null ? String(entity.wire_size) : '',
    thickness: entity.thickness != null ? String(entity.thickness) : '',
    design_name: entity.design_name != null ? String(entity.design_name) : '',
    description: entity.description != null ? String(entity.description) : '',
    weight_details: weightDetails,
    // Weight details totals
    total_alloy_vadotar: entity.total_alloy_vadotar != null ? String(entity.total_alloy_vadotar) : '',
  };
}

export default function MeltingLotCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [submitLoading, setSubmitLoading] = useState(false);
  const meltingLotFormRef = useRef<MeltingLotFormRef>(null);

  const handleSubmit = useCallback(
    async (formData: MeltingLotFormData) => {
      const payload = toMeltingLotPayload(formData);
      setSubmitLoading(true);
      try {
        const res = await createEntity(ENTITY_NAME, payload);
        toast.success(`${entityConfig.displayName} created successfully.`);
        const id = getCreatedEntityId(res, payload as Record<string, unknown>, [
          'name',
          'id',
          'melting_lot_id',
        ]);
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
      if (meltingLotFormRef.current?.validate()) {
        const formData = meltingLotFormRef.current.getData();
        handleSubmit(formData);
      }
    },
    [handleSubmit]
  );

  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const breadcrumbLabel = `Add ${entityConfig.displayName}`;

  return (
    <div className={getCreateEditViewPageWrapperClass(isDarkMode)}>
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
          New Melting Lot
        </h1>
        <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Enter melting lot details and save.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <MeltingLotForm
          ref={meltingLotFormRef}
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
            {submitLoading ? 'Saving...' : 'Create Melting Lot'}
          </button>
        </div>
      </form>
    </div>
  );
}
