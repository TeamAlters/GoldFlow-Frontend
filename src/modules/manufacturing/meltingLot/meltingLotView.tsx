import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth, isNotFoundErrorOrMessage, isNotFoundResponse } from '../../../shared/utils/errorHandling';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { useUIStore } from '../../../stores/ui.store';
import { toast } from '../../../stores/toast.store';
import { type MeltingLotFormData, type WeightDetail } from './meltiingLotForm';
import { toInitialMeltingLotData } from './meltingLotCreate';
import { submitMeltingLot, startDepartment, hasJobCardsForMeltingLot } from './meltingLot.api';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import ViewPageActionBar from '../../../shared/components/ViewPageActionBar';
import type { ViewPageAction } from '../../../shared/components/ViewPageActions';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import EditableWeightTable from '../../../shared/components/EditableWeightTable';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import { invalidateEntityListCache } from '../../admin/admin.api';
import { useEntityMutationStore } from '../../../stores/entityMutation.store';
import { useEntityDelete } from '../../../shared/hooks/useEntityDelete';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_DEFAULT, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'melting_lot';

export default function MeltingLotViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [initialData, setInitialData] = useState<Partial<MeltingLotFormData> | undefined>(undefined);
  const [weightDetails, setWeightDetails] = useState<WeightDetail[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Additional fields from API response
  const [meltingLotName, setMeltingLotName] = useState<string>('');
  const [totalAlloyVadotar, setTotalAlloyVadotar] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [purityPercentage, setPurityPercentage] = useState<string>('');
  const [isStartingDepartment, setIsStartingDepartment] = useState(false);
  const [hasJobCardsForLot, setHasJobCardsForLot] = useState(false);
  // Submit dialog state
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rawEntity, setRawEntity] = useState<Record<string, unknown> | undefined>(undefined);
  const bumpVersion = useEntityMutationStore((s) => s.bumpVersion);
  const { deleteById, deletingId } = useEntityDelete(ENTITY_NAME);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, id)
      .then((res) => {
        if (isNotFoundResponse(res as Record<string, unknown>)) {
          setNotFound(true);
          return;
        }
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          
          // Parse basic form data
          setInitialData(toInitialMeltingLotData(entity));
          setRawEntity(entity);
          // Set additional fields
          setMeltingLotName(entity.name != null ? String(entity.name) : '');
          setTotalAlloyVadotar(entity.total_alloy_vadotar != null ? String(entity.total_alloy_vadotar) : '');
          setStatus(entity.status != null ? String(entity.status) : '');
          setPurityPercentage(entity.purity_percentage != null ? String(entity.purity_percentage) : '');
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/9e661e4b-dcf6-42e4-a9d4-87b9c1be1cf9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'949619'},body:JSON.stringify({sessionId:'949619',location:'meltingLotView.tsx:entity-loaded',message:'Entity loaded from API',data:{rawStatus:entity.status,statusType:typeof entity.status,meltingLotName:entity.name},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
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
        if (isNotFoundErrorOrMessage(err)) {
          setNotFound(true);
          return;
        }
        const msg = err instanceof Error ? err.message : 'Failed to load melting lot';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  // When status is Submitted, check if job cards already exist for this lot so we can hide Start Department
  useEffect(() => {
    const isSubmittedStatus = status.trim().toLowerCase() === 'submitted';
    if (!isSubmittedStatus || !meltingLotName.trim()) {
      setHasJobCardsForLot(false);
      return;
    }
    setHasJobCardsForLot(true); // Hide button until we know; show only when confirmed no job cards
    let cancelled = false;
    hasJobCardsForMeltingLot(meltingLotName)
      .then((has) => {
        if (!cancelled) setHasJobCardsForLot(has);
        // #region agent log
        if (!cancelled) fetch('http://127.0.0.1:7242/ingest/9e661e4b-dcf6-42e4-a9d4-87b9c1be1cf9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'949619'},body:JSON.stringify({sessionId:'949619',location:'meltingLotView.tsx:hasJobCards-result',message:'hasJobCardsForMeltingLot result',data:{meltingLotName,has},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      })
      .catch(() => {
        if (!cancelled) setHasJobCardsForLot(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, meltingLotName]);

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
        // Submitting a melting lot creates the first job card – refresh job_card lists everywhere
        invalidateEntityListCache('job_card');
        bumpVersion('job_card');
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
  }, [meltingLotName, bumpVersion]);

  const handleStartDepartment = useCallback(async () => {
    if (!meltingLotName) return;

    setIsStartingDepartment(true);
    try {
      const response = await startDepartment(meltingLotName);
      if (response.success) {
        toast.success(response.message || 'Department started successfully');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start department';
      if (msg.toLowerCase().includes('job cards already exist')) {
        setHasJobCardsForLot(true);
      }
      showErrorToastUnlessAuth(msg);
    } finally {
      setIsStartingDepartment(false);
    }
  }, [meltingLotName]);

  // Check if status allows editing (Draft = can edit & show Submit; Submitted = show Start Department when no job cards)
  const isSubmitted = status.trim().toLowerCase() === 'submitted';
  const canEdit = !isSubmitted;

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);

  const editUrl = entityConfig.routes.edit?.replace(':id', id ?? '') ?? '';
  const isDeleting = deletingId === (id ?? '');

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

  const displayValue = meltingLotName || initialData?.product || 'Melting Lot';
  const viewPageHeading = getViewPageHeading(entityConfig, displayValue);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, displayValue);

  const viewActions: ViewPageAction[] = [];
  if (canEdit) {
    viewActions.push({ label: 'Edit', href: editUrl });
    viewActions.push({
      label: 'Submit',
      onClick: () => setShowSubmitDialog(true),
      disabled: false,
    });
    viewActions.push({
      label: 'Delete',
      onClick: () => setShowDeleteDialog(true),
      variant: 'danger',
      disabled: isDeleting,
    });
  }
  // When Submitted: always show Start Department; backend errors if job cards already exist
  if (isSubmitted) {
    viewActions.push({
      label: 'Start Department',
      onClick: handleStartDepartment,
      disabled: isStartingDepartment,
    });
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/9e661e4b-dcf6-42e4-a9d4-87b9c1be1cf9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'949619'},body:JSON.stringify({sessionId:'949619',location:'meltingLotView.tsx:viewActions-built',message:'viewActions built',data:{status,isSubmitted,hasJobCardsForLot,canEdit,actionsCount:viewActions.length,hasStartDept:viewActions.some(a=>a.label==='Start Department')},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Weight Details columns
  const weightDetailColumns = [
    { key: 'selected_weight', header: 'Weight', width: 'w-28', isReadOnly: true },
    { key: 'selected_purity', header: 'Purity', width: 'w-32', isReadOnly: true },
    { key: 'purity_percentage', header: 'Purity %', width: 'w-24', isReadOnly: true },
    { key: 'fine_weight', header: 'Fine Weight', width: 'w-28', isReadOnly: true },
    { key: 'alloy_weight', header: 'Alloy Weight', width: 'w-28', isReadOnly: true },
    { key: 'description', header: 'Description', width: 'w-40', isReadOnly: true },
  ];


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
            <ViewPageActionBar onBack={handleBack} actions={viewActions} isDarkMode={isDarkMode} />
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
              <label className={labelClass}>Parent Melting Lot</label>
              <div className={valueClass}>
                {initialData?.parent_melting_lot
                  ? (() => { const r = getEntityDetailRoute('parent_melting_lot', initialData.parent_melting_lot); return r ? <Link to={r} className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}>{initialData.parent_melting_lot}</Link> : initialData.parent_melting_lot; })()
                  : 'NA'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Product</label>
              <div className={valueClass}>
                {initialData?.product
                  ? (() => { const r = getEntityDetailRoute('product', initialData.product); return r ? <Link to={r} className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}>{initialData.product}</Link> : initialData.product; })()
                  : 'NA'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Purity</label>
              <div className={valueClass}>
                {initialData?.purity
                  ? (() => { const r = getEntityDetailRoute('purity', initialData.purity); return r ? <Link to={r} className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}>{initialData.purity}</Link> : initialData.purity; })()
                  : 'NA'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Purity %</label>
              <div className={valueClass}>{purityPercentage ? `${purityPercentage}` : 'NA'}</div>
            </div>
            <div>
              <label className={labelClass}>Accessory Purity</label>
              <div className={valueClass}>
                {initialData?.accessory_purity
                  ? (() => { const r = getEntityDetailRoute('accessory_purity', initialData.accessory_purity); return r ? <Link to={r} className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}>{initialData.accessory_purity}</Link> : initialData.accessory_purity; })()
                  : 'NA'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Wire Size</label>
              <div className={valueClass}>
                {initialData?.wire_size
                  ? (() => { const r = getEntityDetailRoute('wire_size', initialData.wire_size); return r ? <Link to={r} className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}>{initialData.wire_size}</Link> : initialData.wire_size; })()
                  : 'NA'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Thickness</label>
              <div className={valueClass}>
                {initialData?.thickness
                  ? (() => { const r = getEntityDetailRoute('thickness', initialData.thickness); return r ? <Link to={r} className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}>{initialData.thickness}</Link> : initialData.thickness; })()
                  : 'NA'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Design Name</label>
              <div className={valueClass}>
                {initialData?.design_name
                  ? (() => { const r = getEntityDetailRoute('design_name', initialData.design_name); return r ? <Link to={r} className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}>{initialData.design_name}</Link> : initialData.design_name; })()
                  : 'NA'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <div className={valueClass}>{status || 'NA'}</div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <div className={valueClass}>{initialData?.description || 'NA'}</div>
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
                  : 'NA'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Total Fine Weight</label>
              <div className={valueClass}>
                {weightDetails.length > 0
                  ? weightDetails.reduce((sum, d) => sum + (parseFloat(d.fine_weight) || 0), 0).toFixed(4)
                  : 'NA'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Total Alloy Weight</label>
              <div className={valueClass}>
                {weightDetails.length > 0
                  ? weightDetails.reduce((sum, d) => sum + (parseFloat(d.alloy_weight) || 0), 0).toFixed(4)
                  : 'NA'}
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
                  : 'NA'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Total Alloy Vadotar</label>
              <div className={valueClass}>{totalAlloyVadotar || 'NA'}</div>
            </div>
          </div>
        </div>
       <AuditTrailsCard entity={rawEntity} asSection />
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
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={async () => {
          if (!id) return;
          await deleteById(id, entityConfig.displayName);
          setShowDeleteDialog(false);
          navigate(entityConfig.routes.list);
        }}
        title={`Delete ${entityConfig.displayName}`}
        message={`Are you sure you want to delete "${meltingLotName || entityConfig.displayName}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
