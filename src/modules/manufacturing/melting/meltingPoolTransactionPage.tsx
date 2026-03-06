import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import type { TableColumn } from '../../../shared/components/DataTable';
import FilterComponent from '../../../shared/components/FilterComponent';
import ListPageLayout from '../../../shared/components/ListPageLayout';
import Pagination from '../../../shared/components/Pagination';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { buildEntityListColumns } from '../../../shared/utils/entityListColumns';
import { useEntityListPage } from '../../../shared/hooks/useEntityListPage';

const ENTITY_NAME = 'melting_pool_transaction';
type EntityRow = Record<string, unknown>;

export default function MeltingPoolTransactionPage() {
  const navigate = useNavigate();
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const {
    entityConfig,
    entityMetadata,
    metadataLoading,
    metadataError,
    items,
    listLoading,
    page,
    setPage,
    pageSize,
    totalItems,
    totalPages,
    filters,
    setFilters,
    filterConfig,
    hasFilters,
  } = useEntityListPage(ENTITY_NAME);

  const idField = entityMetadata?.id_field ?? 'id';

  const columns: TableColumn<EntityRow>[] = useMemo(() => {
    const visibleFields = entityMetadata?.fields?.filter((f) => f.visible_in_list) ?? [];
    if (!visibleFields.length) return [];
    const detailLinkField = entityMetadata?.detail_link_field ?? visibleFields[0]?.name;
    return buildEntityListColumns({
      visibleFields,
      detailLinkField,
      idField,
      detailRoute: entityConfig.routes.detail,
      isDarkMode,
      navigate,
      encodeId: true,
      data: items,
    });
  }, [entityMetadata, isDarkMode, navigate, entityConfig.routes.detail, items, idField]);

  const handleRowClick = useCallback(
    (row: EntityRow) => {
      const rowId = row[idField];
      if (rowId === undefined || rowId === null) return;
      navigate(entityConfig.routes.detail.replace(':id', encodeURIComponent(String(rowId))));
    },
    [idField, navigate, entityConfig.routes.detail]
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural },
        ]}
        className="mb-4"
      />
      <ListPageLayout
        title={
          metadataLoading
            ? '...'
            : (entityMetadata?.display_name ?? entityConfig.displayNamePlural)
        }
        description={`View all ${entityConfig.displayNamePlural.toLowerCase()}`}
        toolbarLeft={
          <h2
            className={`flex items-center gap-2 flex-nowrap whitespace-nowrap text-xl font-bold tracking-tight ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            <span>Total Data:</span>
            <span>{listLoading ? '...' : totalItems}</span>
          </h2>
        }
        filters={
          hasFilters ? (
            <FilterComponent
              columns={columns}
              config={filterConfig}
              onFilterChange={setFilters}
              initialFilters={filters}
            />
          ) : undefined
        }
      >
        {!metadataLoading && !metadataError && columns.length === 0 && (
          <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading table columns and filters…
          </p>
        )}
        <DataTable
          data={items}
          columns={columns}
          searchable={false}
          pagination={totalPages <= 1}
          pageSize={pageSize}
          loading={listLoading}
          onRowClick={handleRowClick}
          emptyMessage={`No ${entityConfig.displayNamePlural.toLowerCase()} found`}
        />
        <Pagination
          page={page}
          pageSize={pageSize ?? 20}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={listLoading}
        />
      </ListPageLayout>
    </>
  );
}
