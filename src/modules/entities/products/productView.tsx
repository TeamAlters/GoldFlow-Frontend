import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, deleteEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { getSectionClass, getCreateEditViewPageWrapperClass } from '../../../shared/utils/viewPageStyles';
import { useUIStore } from '../../../stores/ui.store';
import { toast } from '../../../stores/toast.store';
import StaticProductForm, { type StaticProductFormData } from './productForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toInitialProductData, getProductEntityFromResponse } from './productCreate';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import BackButton from '../../../shared/components/BackButton';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';

const ENTITY_NAME = 'product';

export default function ProductViewPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const entityConfig = getEntityConfig(ENTITY_NAME);

    const [initialData, setInitialData] = useState<Partial<StaticProductFormData> | undefined>(
        undefined
    );
    const [rawEntity, setRawEntity] = useState<Record<string, unknown> | undefined>(undefined);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    
    // Delete dialog state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!id || String(id).trim() === '') return;
        let mounted = true;
        const decodedId = decodeURIComponent(String(id).trim());
        setDataLoading(true);
        setLoadError(null);
        getEntity(ENTITY_NAME, decodedId)
            .then((res) => {
                if (!mounted) return;
                const entity = getProductEntityFromResponse(res as Record<string, unknown>);
                if (entity) {
                    setInitialData(toInitialProductData(entity));
                    setRawEntity(entity);
                    setLoadError(null);
                } else {
                    setLoadError('Product not found or invalid response from server.');
                }
            })
            .catch((err) => {
                if (!mounted) return;
                const msg = err instanceof Error ? err.message : '';
                if (msg === 'canceled' || msg === 'aborted' || msg.toLowerCase().includes('cancel')) return;
                setLoadError(msg || 'Failed to load product');
                showErrorToastUnlessAuth(msg || 'Failed to load product');
            })
            .finally(() => {
                if (mounted) setDataLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, [id]);

    const handleBack = useCallback(() => {
        navigate(entityConfig.routes.list);
    }, [navigate, entityConfig.routes.list]);

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!id) return;
        setIsDeleting(true);
        try {
            await deleteEntity(ENTITY_NAME, id);
            toast.success(`${entityConfig.displayName} deleted successfully.`);
            navigate(entityConfig.routes.list);
        } catch (err) {
            const msg = err instanceof Error ? err.message : `Failed to delete ${entityConfig.displayName}`;
            showErrorToastUnlessAuth(msg);
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    }, [id, entityConfig, navigate]);

    const isDarkMode = useUIStore((state) => state.isDarkMode);
    const sectionClass = getSectionClass(isDarkMode);

    const editUrl = entityConfig.routes.edit.replace(':id', id != null ? encodeURIComponent(id) : '');

    if (!id) {
        return <Navigate to={entityConfig.routes.list} replace />;
    }

    if (dataLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loading product...
                    </p>
                </div>
            </div>
        );
    }

    if (loadError || !initialData) {
        return (
            <div className={getCreateEditViewPageWrapperClass(isDarkMode)}>
                <Breadcrumbs
                    items={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
                        { label: getViewPageHeading(entityConfig, undefined) },
                    ]}
                    className="mb-4"
                />
                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        {loadError ?? 'Product not found.'}
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                        <BackButton onClick={handleBack} />
                        <button
                            type="button"
                            onClick={handleBack}
                            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        >
                            Back to list
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const viewPageHeading = getViewPageHeading(entityConfig, initialData?.product_name);
    const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, initialData?.product_name);

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
                        className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
                            isDarkMode
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                    >
                        Delete
                    </button>
                </div>
            </div>
            <div
                className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
            >
                <div className={sectionClass}>
                    <h2
                        className={`text-lg font-semibold mb-4 pb-2 border-b ${
                            isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
                        }`}
                    >
                        {entityConfig.displayName} Info
                    </h2>
                    <StaticProductForm
                        initialData={initialData}
                        isEdit={true}
                        readOnly={true}
                        wrapInForm={false}
                        showActions={false}
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
