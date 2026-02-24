import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { toast } from '../../../stores/toast.store';
import { type MeltingLotFormData, type WeightDetail } from './meltiingLotForm';
import {
  toInitialMeltingLotData,
} from './meltingLotCreate';
import { submitMeltingLot } from './meltingLot.api';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import BackButton from '../../../shared/components/BackButton';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import EditableWeightTable from '../../../shared/components/EditableWeightTable';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';

const ENTITY_NAME = 'melting_lot';

export default function MeltingLotViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [initialData, setInitialData] = useState<Partial<MeltingLotFormData> | undefined>(undefined);
  const [weightDetails, setWeightDetails] = useState<WeightDetail[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Additional fields from API response
  const [meltingLotName, setMeltingLotName] = useState<string>('');
  const [totalAlloyVadotar, setTotalAlloyVadotar] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [purityPercentage, setPurityPercentage] = useState<string>('');
  
  // Submit dialog state
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, id)
      .then((res) => {
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          
          // Parse basic form data
          setInitialData(toInitialMeltingLotData(entity));
          
          // Set additional fields
          setMeltingLotName(entity.name != null ? String(entity.name) : '');
          setTotalAlloyVadotar(entity.total_alloy_vadotar != null ? String(entity.total_alloy_vadotar) : '');
          setStatus(entity.status != null ? String(entity.status) : '');
          setPurityPercentage(entity.purity_percentage != null ? String(entity.purity_percentage) : '');
          
          // Parse weight details - API returns different field names
          const wd = entity.weight_details;
          if (Array.isArray(wd)) {
            const parsedDetails: WeightDetail[] = wd.map((item: Record<string, unknown>) => ({
              selected_weight: item.selected_weight != null ? String(item.selected_weight) : '',
              selected_purity: item.selected_purity != null ? String(item.selected_purity) : '',
              // API returns selected_purity_percentage, map to purity_percentage
              purity_percentage: item.selected_purity_percentage != null ? String(item.selected_purity_percentage) : '',
              // API returns selected_fine_weight, map to fine_weight
              fine_weight: item.selected_fine_weight != null ? String(item.selected_fine_weight) : '',
              // API returns selected_alloy_weight, map to alloy_weight
              alloy_weight: item.selected_alloy_weight != null ? String(item.selected_alloy_weight) : '',
              description: item.description != null ? String(item.description) : '',
            }));
            setWeightDetails(parsedDetails);
          }
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load melting lot';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  // Handle submit melting lot
  const handleSubmit = useCallback(async () => {
    if (!meltingLotName) return;
    
    try {
      const response = await submitMeltingLot(meltingLotName);
      if (response.success) {
        toast.success(response.message || 'Melting lot submitted successfully');
        // Update local status to "Submitted"
        if (response.data && typeof response.data === 'object') {
          const data = response.data as Record<string, unknown>;
          setStatus(data.status != null ? String(data.status) : 'Submitted');
        } else {
          setStatus('Submitted');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit melting lot';
      showErrorToastUnlessAuth(msg);
      throw err; // Re-throw to let the dialog handle the error
    }
  }, [meltingLotName]);

  // Check if status allows editing
  const canEdit = status !== 'Submitted';

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const editUrl = entityConfig.routes.edit.replace(':id', id ?? '');

  if (!id) {
    return <Navigate to={entityConfig.routes.list} replace />;
  }

  const displayValue = meltingLotName || initialData?.product || 'Melting Lot';
  const viewPageHeading = getViewPageHeading(entityConfig, displayValue);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, displayValue);

  // Weight Details columns
  const weightDetailColumns = [
    { key: 'selected_weight', header: 'Weight', width: 'w-28', isReadOnly: true },
    { key: 'selected_purity', header: 'Purity', width: 'w-32', isReadOnly: true },
    { key: 'purity_percentage', header: 'Purity %', width: 'w-24', isReadOnly: true },
    { key: 'fine_weight', header: 'Fine Weight', width: 'w-28', isReadOnly: true },
    { key: 'alloy_weight', header: 'Alloy Weight', width: 'w-28', isReadOnly: true },
    { key: 'description', header: 'Description', width: 'w-40', isReadOnly: true },
  ];

  const sectionClass = `border rounded-lg p-4 mb-4 ${
    isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
  }`;

  const labelClass = `block text-sm font-semibold mb-1 ${
    isDarkMode ? 'text-gray-400' : 'text-gray-600'
  }`;

  const valueClass = `min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm font-medium ${
    isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
  }`;

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading melting lot...
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
          { label: breadcrumbLabel },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1
            className={`text-2xl sm:text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {viewPageHeading}
          </h1>
          <div className="flex items-center gap-3">
            <BackButton onClick={handleBack} />
            {canEdit && (
              <Link
                to={editUrl}
                className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
                  isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Edit {entityConfig.displayName}
              </Link>
            )}
            {canEdit && (
              <button
                onClick={() => setShowSubmitDialog(true)}
                className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
                  isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                Submit
              </button>
            )}
          </div>
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {getViewPageDescription(entityConfig)}
        </p>
      </div>

      <div
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        {/* Melting Lot Details Section */}
        <div className={sectionClass}>
          <h3
            className={`text-lg font-semibold mb-4 pb-2 border-b ${
              isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
            }`}
          >
            Melting Lot Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <div className={valueClass}>{meltingLotName || '—'}</div>
            </div>
            <div>
              <label className={labelClass}>Product</label>
              <div className={valueClass}>{initialData?.product || '—'}</div>
            </div>
            <div>
              <label className={labelClass}>Purity</label>
              <div className={valueClass}>{initialData?.purity || '—'}</div>
            </div>
            <div>
              <label className={labelClass}>Purity %</label>
              <div className={valueClass}>{purityPercentage ? `${purityPercentage}` : '—'}</div>
            </div>
            <div>
              <label className={labelClass}>Accessory Purity</label>
              <div className={valueClass}>{initialData?.accessory_purity || '—'}</div>
            </div>
            <div>
              <label className={labelClass}>Wire Size</label>
              <div className={valueClass}>{initialData?.wire_size || '—'}</div>
            </div>
            <div>
              <label className={labelClass}>Thickness</label>
              <div className={valueClass}>{initialData?.thickness || '—'}</div>
            </div>
            <div>
              <label className={labelClass}>Design Name</label>
              <div className={valueClass}>{initialData?.design_name || '—'}</div>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <div className={valueClass}>{status || '—'}</div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <div className={valueClass}>{initialData?.description || '—'}</div>
            </div>
          </div>
        </div>

        {/* Weight Details Section */}
        <div className={sectionClass}>
          <h3
            className={`text-lg font-semibold mb-4 pb-2 border-b ${
              isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
            }`}
          >
            Weight Details
          </h3>
          {weightDetails.length > 0 ? (
            <EditableWeightTable<WeightDetail>
              columns={weightDetailColumns}
              data={weightDetails}
              readOnly={true}
              showAddButton={false}
              showTotals={false}
            />
          ) : (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No weight details available
            </div>
          )}
        </div>

        {/* Weight Details Totals Section */}
        <div className={sectionClass}>
          <h3
            className={`text-lg font-semibold mb-4 pb-2 border-b ${
              isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
            }`}
          >
            Weight Details Totals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className={labelClass}>Total Metal Weight</label>
              <div className={valueClass}>
                {weightDetails.length > 0
                  ? weightDetails.reduce((sum, d) => sum + (parseFloat(d.selected_weight) || 0), 0).toFixed(4)
                  : '—'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Total Fine Weight</label>
              <div className={valueClass}>
                {weightDetails.length > 0
                  ? weightDetails.reduce((sum, d) => sum + (parseFloat(d.fine_weight) || 0), 0).toFixed(4)
                  : '—'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Total Alloy Weight</label>
              <div className={valueClass}>
                {weightDetails.length > 0
                  ? weightDetails.reduce((sum, d) => sum + (parseFloat(d.alloy_weight) || 0), 0).toFixed(4)
                  : '—'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Total Gross Weight</label>
              <div className={valueClass}>
                {weightDetails.length > 0
                  ? (
                      weightDetails.reduce((sum, d) => sum + (parseFloat(d.selected_weight) || 0), 0) +
                      weightDetails.reduce((sum, d) => sum + (parseFloat(d.alloy_weight) || 0), 0) +
                      parseFloat(totalAlloyVadotar || '0')
                    ).toFixed(4)
                  : '—'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Total Alloy Vadotar</label>
              <div className={valueClass}>{totalAlloyVadotar || '—'}</div>
            </div>
          </div>
        </div>

      </div>

      <ConfirmationDialog
        isOpen={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        onConfirm={handleSubmit}
        title="Submit Melting Lot"
        message={`Are you sure you want to submit "${meltingLotName}"? This action cannot be undone.`}
        confirmLabel="Submit"
        cancelLabel="Cancel"
        variant="primary"
      />
    </div>
  );
}
