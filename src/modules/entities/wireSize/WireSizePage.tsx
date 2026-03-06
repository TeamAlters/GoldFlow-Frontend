import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../shared/components/DataTable';
import type { TableColumn, TableAction } from '../../../shared/components/DataTable';
import FilterComponent from '../../../shared/components/FilterComponent';
import ListPageLayout from '../../../shared/components/ListPageLayout';
import Pagination from '../../../shared/components/Pagination';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { buildEntityListColumns } from '../../../shared/utils/entityListColumns';
import { useEntityDelete } from '../../../shared/hooks/useEntityDelete';
import { useEntityListPage } from '../../../shared/hooks/useEntityListPage';

type EntityRow = Record<string, unknown>;

export default function WireSizePage() {
  const navigate = useNavigate();
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const entityName = 'wire_size';
  const [deleteConfirmRow, setDeleteConfirmRow] = useState<EntityRow | null>(null);
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
  } = useEntityListPage(entityName);
  const { deleteById, deletingId } = useEntityDelete(entityName);

  const columns: TableColumn<EntityRow>[] = useMemo(() => {
    const visibleFields = entityMetadata?.fields?.filter((f) => f.visible_in_list) ?? [];
    if (!visibleFields.length) return [];
    const detailLinkField = entityMetadata?.detail_link_field ?? visibleFields[0]?.name;
    const idField = entityMetadata?.id_field ?? 'wire_size';
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
  }, [entityMetadata, isDarkMode, navigate, entityConfig, items]);

  const handleAddEntity = () => {
    const addRoute = entityConfig.routes.add ?? entityConfig.routes.list;
    navigate(addRoute);
  };

  const idField = entityMetadata?.id_field ?? 'wire_size';

  const handleDeleteClick = useCallback((row: EntityRow) => {
    setDeleteConfirmRow(row);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmRow) return;
    const rowId = deleteConfirmRow[idField];
    if (rowId === undefined || rowId === null) return;
    setDeleteConfirmRow(null);
    await deleteById(String(rowId), entityConfig.displayName);
  }, [deleteConfirmRow, entityConfig.displayName, idField, deleteById]);

  const actions: TableAction<EntityRow>[] = useMemo(
    () => [
      {
        label: 'Edit',
        onClick: (row) => {
          const rowId = row[idField];
          if (rowId !== undefined && rowId !== null) {
            const editRoute = entityConfig.routes.edit;
            if (editRoute) {
              navigate(editRoute.replace(':id', String(rowId)));
            }
          }
        },
        variant: 'primary' as const,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        ),
      },
      {
        label: 'Delete',
        onClick: handleDeleteClick,
        disabled: (row: EntityRow) => deletingId === String(row[idField] ?? ''),
        variant: 'danger' as const,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        ),
      },
    ],
    [idField, navigate, entityConfig.routes.edit, handleDeleteClick]
  );

  const handleRowClick = useCallback(
    (row: EntityRow) => {
      const rowId = row[idField];
      if (rowId === undefined || rowId === null) return;
      navigate(entityConfig.routes.detail.replace(':id', encodeURIComponent(String(rowId))));
    },
    [idField, navigate, entityConfig.routes.detail]
  );

  const deleteDisplayName =
    deleteConfirmRow != null
      ? String(deleteConfirmRow.wire_size ?? deleteConfirmRow.name ?? 'this wire size')
      : '';

  return (
    <>
      <ConfirmationDialog
        isOpen={deleteConfirmRow != null}
        onClose={() => setDeleteConfirmRow(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${entityConfig.displayName}`}
        message={
          deleteDisplayName
            ? `Are you sure you want to delete "${deleteDisplayName}"? This action cannot be undone.`
            : `Are you sure you want to delete this ${entityConfig.displayName.toLowerCase()}?`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
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
            : (entityMetadata?.display_name ?? `${entityConfig.displayNamePlural} Management`)
        }
        description={`Manage all ${entityConfig.displayNamePlural.toLowerCase()}`}
        toolbarLeft={
          <h2
            className={`flex items-center gap-2 flex-nowrap whitespace-nowrap text-xl font-bold tracking-tight ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            <span>Total Data:</span>
            <span>{listLoading ? '...' : totalItems}</span>
          </h2>
        }
        toolbarRight={
          <button
            className={`w-full sm:w-auto px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            onClick={handleAddEntity}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add {entityConfig.displayName}</span>
          </button>
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
          actions={actions}
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
