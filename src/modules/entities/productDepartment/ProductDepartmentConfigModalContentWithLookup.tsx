import { useState, useEffect } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { getEntityList } from '../../admin/admin.api';
import ProductDepartmentConfigModalContent from './ProductDepartmentConfigModalContent';

const ENTITY_NAME = 'product_department';

export interface ProductDepartmentConfigModalContentWithLookupProps {
  departmentGroupId: string;
  productId: string;
  departmentId: string;
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * When product_department_id is not on the row, resolve it by fetching product_department list
 * filtered by department_group and matching department, then show Configurations modal.
 */
export default function ProductDepartmentConfigModalContentWithLookup({
  departmentGroupId,
  productId: _productId,
  departmentId,
  onClose,
  onSaved,
}: ProductDepartmentConfigModalContentWithLookupProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!departmentGroupId || !departmentId) {
      setResolvedId(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    setResolvedId(null);
    getEntityList(ENTITY_NAME, { page: 1, page_size: 500 })
      .then((res) => {
        if (!mounted) return;
        const items = (res.data?.items ?? []) as Record<string, unknown>[];
        const match = items.find((item) => {
          const d = item.department ?? item.department_id ?? item.department_name;
          const dg = item.department_group ?? item.department_group_id ?? item.department_group_name;
          return String(d ?? '') === String(departmentId) && String(dg ?? '') === String(departmentGroupId);
        });
        if (match && (match.id != null || match.product_department_id != null)) {
          setResolvedId(String(match.id ?? match.product_department_id));
        } else {
          setError('Product department not found for this department.');
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load configurations');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [departmentGroupId, departmentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !resolvedId) {
    return (
      <p className={`text-sm ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
        {error ?? 'Save the department group first to edit configurations for this department.'}
      </p>
    );
  }

  return (
    <ProductDepartmentConfigModalContent
      productDepartmentId={resolvedId}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
