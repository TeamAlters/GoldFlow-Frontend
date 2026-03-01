import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import {
  createEntity,
  getEntityReferenceOptions,
  getEntityListOptions,
} from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { toast } from '../../../stores/toast.store';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import JobCardForm, {
  type JobCardFormData,
} from './jobCardForm';

const ENTITY_NAME = 'job_card';

export default function JobCardCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const [isLoading, setIsLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [parentMeltingLotOptions, setParentMeltingLotOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [meltingLotOptions, setMeltingLotOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [purityOptions, setPurityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [departmentGroupOptions, setDepartmentGroupOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [designOptions, setDesignOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [previousJobCardOptions, setPreviousJobCardOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const [
          products,
          parentMeltingLots,
          meltingLots,
          purities,
          departments,
          departmentGroups,
          designs,
          jobCards,
        ] = await Promise.all([
          getEntityReferenceOptions('product', 'product_name', 'product_name'),
          getEntityListOptions('parent_melting_lot', 'name', 'name'),
          getEntityListOptions('melting_lot', 'name', 'name'),
          getEntityReferenceOptions('purity', 'purity', 'purity'),
          getEntityReferenceOptions('department', 'name', 'name'),
          getEntityListOptions('product_department_group', 'name', 'name'),
          getEntityReferenceOptions('design', 'design_name', 'design_name'),
          getEntityListOptions('job_card', 'name', 'name'),
        ]);

        setProductOptions(products);
        setParentMeltingLotOptions(parentMeltingLots);
        setMeltingLotOptions(meltingLots);
        setPurityOptions(purities);
        setDepartmentOptions(departments);
        setDepartmentGroupOptions(departmentGroups);
        setDesignOptions(designs);
        setPreviousJobCardOptions(jobCards);
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
    async (data: JobCardFormData) => {
      setIsLoading(true);
      try {
        const payload = {
          product: data.product,
          parent_melting_lot: data.parent_melting_lot || '',
          melting_lot: data.melting_lot,
          purity: data.purity,
          department: data.department,
          department_group: data.department_group,
          design: data.design,
          previous_job_card: data.previous_job_card || '',
          qty: data.qty.trim() ? parseInt(data.qty, 10) : 0,
        };

        const response = await createEntity(ENTITY_NAME, payload);

        if (response.success) {
          toast.success(response.message || 'Job card created successfully');
          const createdId = getCreatedEntityId(response, payload, ['name']);
          if (createdId != null) {
            navigate(
              entityConfig.routes.detail.replace(':id', encodeURIComponent(String(createdId)))
            );
          } else {
            navigate(entityConfig.routes.list);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create job card';
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
            <JobCardForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              productOptions={productOptions}
              parentMeltingLotOptions={parentMeltingLotOptions}
              meltingLotOptions={meltingLotOptions}
              purityOptions={purityOptions}
              departmentOptions={departmentOptions}
              departmentGroupOptions={departmentGroupOptions}
              designOptions={designOptions}
              previousJobCardOptions={previousJobCardOptions}
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
                form="job-card-form"
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
