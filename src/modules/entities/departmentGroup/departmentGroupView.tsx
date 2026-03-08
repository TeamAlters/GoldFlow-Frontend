import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, getEntityReferenceOptions } from '../../admin/admin.api';
import { showErrorToastUnlessAuth, isNotFoundErrorOrMessage, isNotFoundResponse } from '../../../shared/utils/errorHandling';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { useUIStore } from '../../../stores/ui.store';
import StaticDepartmentGroupForm, { type StaticDepartmentGroupFormData } from './departmentGroupForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import type { FormSelectOption } from '../../../shared/components/FormSelect';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import BackButton from '../../../shared/components/BackButton';
import { useEntityDelete } from '../../../shared/hooks/useEntityDelete';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_DEFAULT, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'product_department_group';

interface DepartmentGroupResponse {
  success: boolean;
  message: string;
  data: {
    name: string;
    product: string;
    department_group_name: string;
    step_no: number;
    is_active: boolean;
    departments: Array<{
      name: string;
      product: string;
      department_group: string;
      department: string;
      step_no: number;
      requires_issue: boolean;
      requires_receive: boolean;
      allows_loss: boolean;
      loss_percentage: number;
      is_optional: boolean;
      allow_rework: boolean;
      is_final_department: boolean;
      is_active?: boolean;
      created_at: string;
      modified_at: string;
      created_by: string;
      modified_by: string;
    }>;
    created_at: string;
    modified_at: string;
    created_by: string;
    modified_by: string;
  };
  errors: null;
  status_code: number;
}

function parseDepartmentGroupResponse(data: DepartmentGroupResponse['data']): Partial<StaticDepartmentGroupFormData> {
  const departments = data.departments.map((dept, index) => {
    const obj = dept as Record<string, unknown>;
    const serverId = obj.id != null ? String(obj.id) : '';
    const isClientId = serverId.startsWith('row-');
    const productDepartmentId =
      obj.product_department_id != null
        ? String(obj.product_department_id)
        : serverId && !isClientId
          ? serverId
          : undefined;
    return {
      id: serverId || `row-${index}-${Date.now()}`,
      order: dept.step_no || index + 1,
      department_id: dept.department || '',
      is_active: data.is_active ?? true,
      ...(productDepartmentId ? { product_department_id: productDepartmentId } : {}),
    };
  });

  return {
    name: data.name || '',
    order: String(data.step_no || ''),
    product_id: data.product || '',
    is_active: data.is_active ?? true,
    departments,
  };
}

export default function DepartmentGroupViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [initialData, setInitialData] = useState<Partial<StaticDepartmentGroupFormData> | undefined>(
    undefined
  );
  const [rawEntity, setRawEntity] = useState<Record<string, unknown> | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [productOptions, setProductOptions] = useState<FormSelectOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<FormSelectOption[]>([]);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteById, deletingId } = useEntityDelete(ENTITY_NAME);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getEntityReferenceOptions('product', 'product_name', 'product_name'),
      getEntityReferenceOptions('department'),
    ])
      .then(([products, departments]) => {
        if (ignore) return;
        setProductOptions(products);
        setDepartmentOptions(departments);
      })
      .catch(() => {
        if (!ignore) {
          setProductOptions([]);
          setDepartmentOptions([]);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    setLoadError(null);
    setNotFound(false);

    const fetchDepartmentGroup = async () => {
      try {
        const res = await getEntity(ENTITY_NAME, id);

        if (isNotFoundResponse(res)) {
          setNotFound(true);
          return;
        }
        if (res.data && typeof res.data === 'object') {
          const group = res.data as DepartmentGroupResponse['data'];
          setInitialData(parseDepartmentGroupResponse(group));
          setRawEntity(group as Record<string, unknown>);
          setLoadError(null);
        } else {
          setLoadError((res as { message?: string }).message || 'Failed to load department group');
        }
      } catch (err: unknown) {
        if (isNotFoundErrorOrMessage(err)) {
          setNotFound(true);
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Failed to load department group';
        setLoadError(errorMessage);
        showErrorToastUnlessAuth(errorMessage);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDepartmentGroup();
  }, [id]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!id) return;
    await deleteById(id, entityConfig.displayName);
    setShowDeleteDialog(false);
    navigate(entityConfig.routes.list);
  }, [id, deleteById, entityConfig.displayName, entityConfig.routes.list, navigate]);

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);
  const isDeleting = deletingId === (id ?? '');

  const editUrl = entityConfig.routes.edit?.replace(':id', id ?? '') ?? '';
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

  const displayValue = initialData?.name as string | undefined;
  const viewPageHeading = getViewPageHeading(entityConfig, displayValue);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, displayValue);

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading department group...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_DEFAULT }} replace />
    );
  }

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
            {viewPageHeading}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {getViewPageDescription(entityConfig)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <BackButton onClick={handleBack} />
          <Link
            to={editUrl}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
          >
            Delete
          </button>
        </div>
      </div>
      <div
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
      >
        <div className={sectionClass}>
          <h2
            className={`text-lg font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
              }`}
          >
            {entityConfig.displayName} Info
          </h2>
          <StaticDepartmentGroupForm
            initialData={initialData}
            productOptions={productOptions}
            departmentOptions={departmentOptions}
            isEdit={true}
            readOnly={true}
            wrapInForm={false}
            showActions={false}
            departmentsConfig={
              Array.isArray(rawEntity?.departments) ? (rawEntity.departments as Record<string, unknown>[]) : []
            }
          />
        </div>
        <AuditTrailsCard entity={rawEntity} asSection />
      </div>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title={`Delete ${entityConfig.displayName}`}
        message={`Are you sure you want to delete this ${entityConfig.displayName.toLowerCase()}? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
