import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity, getEntityReferences, mapReferenceItemsToOptions } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { toast } from '../../../stores/toast.store';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import ParentMeltingLotForm, {
  type ParentMeltingLotFormData,
} from './parentMeltingLotForm';

const ENTITY_NAME = 'parent_melting_lot';

export default function ParentMeltingLotCreate() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const [isLoading, setIsLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [purityOptions, setPurityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Fetch product and purity options using references API
  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const [productsRes, puritiesRes] = await Promise.all([
          getEntityReferences('product'),
          getEntityReferences('purity'),
        ]);

        setProductOptions(mapReferenceItemsToOptions(productsRes, 'product_name'));
        setPurityOptions(mapReferenceItemsToOptions(puritiesRes, 'purity'));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load options';
        showErrorToastUnlessAuth(msg);
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleSubmit = useCallback(
    async (data: ParentMeltingLotFormData) => {
      setIsLoading(true);
      try {
        const payload = {
          product: data.product,
          purity: data.purity,
        };

        const response = await createEntity(ENTITY_NAME, payload);

        if (response.success) {
          toast.success(response.message || 'Parent melting lot created successfully');
          const createdId = getCreatedEntityId(response, payload, ['name']);
          navigate(entityConfig.routes.detail.replace(':id', encodeURIComponent(createdId ?? data.name)));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create parent melting lot';
        showErrorToastUnlessAuth(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, entityConfig]
  );

  const handleCancel = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

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
          className={`text-2xl sm:text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Add {entityConfig.displayName}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Create a new {entityConfig.displayName.toLowerCase()}.
        </p>
      </div>

      <div
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        {optionsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading options...
              </p>
            </div>
          </div>
        ) : (
          <>
            <ParentMeltingLotForm
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
                {isLoading ? 'Saving...' : `Create ${entityConfig.displayName}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
