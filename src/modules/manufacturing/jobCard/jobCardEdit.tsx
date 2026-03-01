import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import {
  getEntity,
  updateEntity,
  getEntityReferenceOptions,
  getEntityListOptions,
} from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { toast } from '../../../stores/toast.store';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import JobCardForm, {
  type JobCardFormData,
} from './jobCardForm';

const ENTITY_NAME = 'job_card';

export default function JobCardEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<JobCardFormData> | null>(null);
  const [entityName, setEntityName] = useState<string>('');
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
    const fetchData = async () => {
      if (!id) return;

      setDataLoading(true);
      try {
        const decodedId = decodeURIComponent(id);
        const [
          entityRes,
          products,
          parentMeltingLots,
          meltingLots,
          purities,
          departments,
          departmentGroups,
          designs,
          jobCards,
        ] = await Promise.all([
          getEntity(ENTITY_NAME, decodedId),
          getEntityReferenceOptions('product', 'product_name', 'product_name'),
          getEntityListOptions('parent_melting_lot', 'name', 'name'),
          getEntityListOptions('melting_lot', 'name', 'name'),
          getEntityReferenceOptions('purity', 'purity', 'purity'),
          getEntityReferenceOptions('department', 'name', 'name'),
          getEntityListOptions('product_department_group', 'name', 'name'),
          getEntityReferenceOptions('design', 'design_name', 'design_name'),
          getEntityListOptions('job_card', 'name', 'name'),
        ]);

        if (entityRes.data && typeof entityRes.data === 'object') {
          const entity = entityRes.data as Record<string, unknown>;
          setEntityName(String(entity.name ?? decodedId));
          setInitialData({
            product: String(entity.product ?? ''),
            parent_melting_lot: String(entity.parent_melting_lot ?? ''),
            melting_lot: String(entity.melting_lot ?? ''),
            purity: String(entity.purity ?? ''),
            department: String(entity.department ?? ''),
            department_group: String(entity.department_group ?? ''),
            design: String(entity.design ?? ''),
            previous_job_card: String(entity.previous_job_card ?? ''),
            qty: entity.qty != null ? String(entity.qty) : '',
          });
        }

        setProductOptions(products);
        setParentMeltingLotOptions(parentMeltingLots);
        setMeltingLotOptions(meltingLots);
        setPurityOptions(purities);
        setDepartmentOptions(departments);
        setDepartmentGroupOptions(departmentGroups);
        setDesignOptions(designs);
        setPreviousJobCardOptions(jobCards);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load data';
        showErrorToastUnlessAuth(msg);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = useCallback(
    async (data: JobCardFormData) => {
      if (!id) return;

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

        const response = await updateEntity(ENTITY_NAME, decodeURIComponent(id), payload);

        if (response.success) {
          toast.success(response.message || 'Job card updated successfully');
          navigate(entityConfig.routes.detail.replace(':id', id));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update job card';
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

  if (dataLoading) {
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
          { label: `Edit ${entityName || decodeURIComponent(id)}` },
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
        <JobCardForm
          initialData={initialData ?? undefined}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isEdit={true}
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
            {isLoading ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}
