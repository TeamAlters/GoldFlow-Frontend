import { useMemo } from 'react';
import { useUIStore } from '../../stores/ui.store';
import {
    getEntityNamesForRolesTable,
    getEntityConfig,
} from '../../config/entity.config';

const PERMISSIONS = ['create', 'read', 'update', 'delete', 'export'] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type TablePermissions = Record<Permission, boolean>;
export type PermissionsMatrix = Record<string, TablePermissions>;

const PERMISSION_LABELS: Record<Permission, string> = {
    create: 'Create',
    read: 'Read',
    update: 'Edit',
    delete: 'Delete',
    export: 'Export',
};

export function getPermissionLabel(perm: Permission): string {
    return PERMISSION_LABELS[perm];
}

export function defaultPermissions(): TablePermissions {
    return { create: false, read: false, update: false, delete: false, export: false };
}

export function buildInitialMatrix(entityNames: string[]): PermissionsMatrix {
    const matrix: PermissionsMatrix = {};
    for (const name of entityNames) {
        matrix[name] = defaultPermissions();
    }
    return matrix;
}

export interface RolesPermissionsTableProps {
    matrix: PermissionsMatrix;
    onToggle: (tableKey: string, permission: Permission) => void;
    /** When provided, Select All sets all rows to the target value instead of toggling each. */
    onSelectAll?: (perm: Permission, value: boolean) => void;
    /** When true, checkboxes are disabled (read-only view). */
    readOnly?: boolean;
    /** When true, use entity display names for all rows (e.g. "User" instead of "Category" for user entity). Use only on Roles & Permissions page. */
    useEntityDisplayNames?: boolean;
    /** Optional entity names for table rows. When provided, used instead of getEntityNamesForRolesTable() (e.g. user view/edit/create pass list including "user"). */
    entityNames?: string[];
}

const checkboxClass =
    'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 dark:border-gray-500 dark:bg-gray-700 dark:checked:bg-blue-600 dark:focus:ring-offset-gray-900';

export function RolesPermissionsTable({ matrix, onToggle, onSelectAll, readOnly = false, useEntityDisplayNames = false, entityNames: entityNamesProp }: RolesPermissionsTableProps) {
    const isDarkMode = useUIStore((state) => state.isDarkMode);
    const entityNames = useMemo(
        () => entityNamesProp ?? getEntityNamesForRolesTable(),
        [entityNamesProp]
    );
    const tableRows = useMemo(() => {
        return entityNames.map((key) => ({
            key,
            label: useEntityDisplayNames ? getEntityConfig(key).displayName : (key === 'user' ? 'Category' : getEntityConfig(key).displayName),
        }));
    }, [entityNames, useEntityDisplayNames]);

    const theadBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
    const thText = `text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;
    const thClass = `px-5 py-3.5 ${theadBg}`;
    const tdClass = `px-5 py-3.5 text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`;
    const divideClass = isDarkMode ? 'divide-gray-700' : 'divide-gray-200';
    const rowHover = isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50';
    const tbodyBg = isDarkMode ? 'bg-gray-900/30' : 'bg-white';

    const handleHeaderToggle = (perm: Permission, allChecked: boolean) => {
        if (readOnly) return;
        if (onSelectAll) {
            onSelectAll(perm, !allChecked);
        } else {
            tableRows.forEach((row) => onToggle(row.key, perm));
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
                <thead>
                    <tr className={divideClass}>
                        <th
                            scope="col"
                            className={`${thClass} text-left rounded-tl-xl w-[20%] ${thText}`}
                        >
                            Tables
                        </th>
                        {PERMISSIONS.map((perm) => {
                            const allChecked =
                                tableRows.length > 0 &&
                                tableRows.every(
                                    (row) => (matrix[row.key] ?? defaultPermissions())[perm]
                                );
                            const someChecked = tableRows.some(
                                (row) => (matrix[row.key] ?? defaultPermissions())[perm]
                            );
                            return (
                                <th
                                    key={perm}
                                    scope="col"
                                    className={`${thClass} text-center w-[20%] ${thText}`}
                                >
                                    <label className={`inline-flex items-center justify-center gap-2 select-none ${readOnly ? '' : 'cursor-pointer'}`}>
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            ref={(el) => {
                                                if (el) el.indeterminate = someChecked && !allChecked;
                                            }}
                                            onChange={(e) => {
                                                e.preventDefault();
                                                handleHeaderToggle(perm, allChecked);
                                            }}
                                            className={checkboxClass}
                                            aria-label={`Select all ${getPermissionLabel(perm)}`}
                                            disabled={readOnly}
                                        />
                                        <span>{getPermissionLabel(perm)}</span>
                                    </label>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className={`divide-y ${divideClass} ${tbodyBg}`}>
                    {tableRows.map((row) => (
                        <tr key={row.key} className={`${rowHover} transition-colors`}>
                            <td className={`${tdClass} font-medium`}>{row.label}</td>
                            {PERMISSIONS.map((perm) => {
                                const perms = matrix[row.key] ?? defaultPermissions();
                                const checked = perms[perm];
                                return (
                                    <td
                                        key={perm}
                                        className={`${tdClass} text-center align-middle`}
                                    >
                                        <label className={`inline-flex items-center justify-center select-none min-h-[2rem] ${readOnly ? '' : 'cursor-pointer'}`}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => !readOnly && onToggle(row.key, perm)}
                                                className={checkboxClass}
                                                aria-label={`${row.label} - ${getPermissionLabel(perm)}`}
                                                disabled={readOnly}
                                            />
                                        </label>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
