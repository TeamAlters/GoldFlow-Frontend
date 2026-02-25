import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, getEntityReferences, mapReferenceItemsToOptions, updateEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { toast } from '../../../stores/toast.store';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import ParentMeltingLotForm, {
  type ParentMeltingLotFormData,
} from './parentMeltingLotForm';

const ENTITY_NAME = 'parent_melting_lot';

export default function ParentMeltingLotEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [initialData, setInitialData] = useState<ParentMeltingLotFormData | null>(null);
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [purityOptions, setPurityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Fetch initial data and options
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setDataLoading(true);
      setOptionsLoading(true);
      
      try {
        // Fetch entity data and options in parallel
        const [entityRes, productsRes, puritiesRes] = await Promise.all([
          getEntity(ENTITY_NAME, id),
          getEntityReferences('product'),
          getEntityReferences('purity'),
        ]);

        // Set initial data
        if (entityRes.data && typeof entityRes.data === 'object') {
          const entity = entityRes.data as Record<string, unknown>;
          setInitialData({
            name: String(entity.name ?? ''),
            product: String(entity.product ?? ''),
            product_abbreviation: String(entity.product_abbreviation ?? ''),
            purity: String(entity.purity ?? ''),
          });
        }

        // Set product options
        setProductOptions(mapReferenceItemsToOptions(productsRes, 'product_name'));

        // Set purity options
        setPurityOptions(mapReferenceItemsToOptions(puritiesRes, 'purity'));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load data';
        showErrorToastUnlessAuth(msg);
      } finally {
        setDataLoading(false);
        setOptionsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = useCallback(
    async (data: ParentMeltingLotFormData) => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const payload = {
          product: data.product,
          product_abbreviation: data.product_abbreviation,
          purity: data.purity,
        };

        const response = await updateEntity(ENTITY_NAME, id, payload);

        if (response.success) {
          toast.success(response.message || 'Parent melting lot updated successfully');
          navigate(entityConfig.routes.detail.replace(':id', encodeURIComponent(id)));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update parent melting lot';
        showErrorToastUnlessAuth(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, entityConfig, id]
  );

  const handleCancel = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  if (!id) {
    return <Navigate to={entityConfig.routes.list} replace />;
  }

  if (dataLoading || optionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
          { label: `Edit ${initialData?.name ?? id}` },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Edit {entityConfig.displayName}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Update {entityConfig.displayName.toLowerCase()} details below.
        </p>
      </div>
      <div
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <ParentMeltingLotForm
          initialData={initialData ?? undefined}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          productOptions={productOptions}
          purityOptions={purityOptions}
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
            form="parent-melting-lot-form"
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-60`}
          >
            {isLoading ? 'Saving...' : `Update ${entityConfig.displayName}`}
          </button>
        </div>
      </div>
    </div>
  );
}
