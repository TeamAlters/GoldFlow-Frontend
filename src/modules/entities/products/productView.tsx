import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticProductForm, { type StaticProductFormData } from './productForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toInitialProductData } from './productCreate';

const ENTITY_NAME = 'product';

export default function ProductViewPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const entityConfig = getEntityConfig(ENTITY_NAME);

    const [initialData, setInitialData] = useState<Partial<StaticProductFormData> | undefined>(
        undefined
    );
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        setDataLoading(true);
        getEntity(ENTITY_NAME, id, { signal: controller.signal })
            .then((res) => {
                if (controller.signal.aborted) return;
                if (res.data && typeof res.data === 'object') {
                    const entity = res.data as Record<string, unknown>;
                    setInitialData(toInitialProductData(entity));
                }
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                const msg = err instanceof Error ? err.message : 'Failed to load product';
                showErrorToastUnlessAuth(msg);
            })
            .finally(() => {
                if (!controller.signal.aborted) setDataLoading(false);
            });
        return () => controller.abort();
    }, [id]);

    const handleBack = useCallback(() => {
        navigate(entityConfig.routes.list);
    }, [navigate, entityConfig.routes.list]);

    const isDarkMode = useUIStore((state) => state.isDarkMode);
    const editUrl = entityConfig.routes.edit.replace(':id', id ?? '');

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

    const breadcrumbLabel = initialData?.product_name ?? 'View Product';

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
                    className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                    View {entityConfig.displayName}
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Read-only product information.
                </p>
            </div>
            <div
                className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
            >
                <StaticProductForm
                    initialData={initialData}
                    isEdit={true}
                    readOnly={true}
                    wrapInForm={false}
                    showActions={false}
                />
                <div className="flex items-center justify-end gap-3 pt-6 mt-6">
                    <button
                        type="button"
                        onClick={handleBack}
                        className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                    >
                        Back
                    </button>
                    <Link
                        to={editUrl}
                        className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                    >
                        Edit Product
                    </Link>
                </div>
            </div>
        </div>
    );
}
