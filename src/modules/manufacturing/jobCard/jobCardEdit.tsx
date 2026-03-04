import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import {
  getEntity,
  updateEntity,
  getEntityReferenceOptions,
  getEntityReferenceOptionsFiltered,
} from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { toast } from '../../../stores/toast.store';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import { getSectionHeaderClass } from '../../../shared/utils/viewPageStyles';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { invalidateEntityListCache } from '../../admin/admin.api';
import { useEntityMutationStore } from '../../../stores/entityMutation.store';
import BackButton from '../../../shared/components/BackButton';
import JobCardForm, {
  type JobCardFormData,
} from './jobCardForm';
import EditableWeightTable from '../../../shared/components/EditableWeightTable';
import type { ColumnDef } from '../../../shared/components/EditableWeightTable';
import JobCardReadOnlyTable from '../../../shared/components/JobCardReadOnlyTable';
import Modal from '../../../shared/components/Modal';
import { FormSelect } from '../../../shared/components/FormSelect';
import {
  createIssueTransaction,
  deleteIssueTransaction,
  type IssueTransaction,
} from './jobCardTransactions.api';

const ENTITY_NAME = 'job_card';
const JOB_CARD_TRANSACTION_ENTITY = 'job_card_transaction';
const RECEIPT_TYPE = 'Receipt';
const ISSUE_TYPE = 'Issue';

type JobCardTransaction = IssueTransaction;

type IssueRow = Record<string, string> & { name?: string };

interface CardFlowStep {
  label?: string;
  department?: string;
  department_group?: string;
  purity?: string;
  completed?: boolean;
}

function formatBalance(val: number | string | undefined): string {
  if (val === undefined || val === null) return '–';
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return Number.isFinite(n) ? `${n.toFixed(4)} g` : '–';
}

function computeIssuedWeight(issues: Array<{ weight?: string | number }>): number {
  return (issues ?? []).reduce((sum, o) => sum + (parseFloat(String(o.weight ?? 0)) || 0), 0);
}

function toIssueRow(tx: JobCardTransaction): IssueRow {
  return {
    name: tx.name ?? '',
    item: tx.item ?? '',
    weight: tx.weight ?? '',
    fine_weight: tx.fine_weight ?? '',
    karigar: tx.karigar ?? '',
    qty: tx.qty ?? '',
    design: tx.design ?? '',
    purity: tx.purity ?? '',
  };
}

export default function JobCardEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const jobCardTransactionConfig = getEntityConfig(JOB_CARD_TRANSACTION_ENTITY);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const bumpVersion = useEntityMutationStore((state: { bumpVersion: (entityName: string) => void }) => state.bumpVersion);


  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<JobCardFormData> | null>(null);
  const [entityName, setEntityName] = useState<string>('');
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [purityOptions, setPurityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [designOptions, setDesignOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [karigarOptions, setKarigarOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [itemOptions, setItemOptions] = useState<Array<{ value: string; label: string }>>([]);

  const [receiptTransactions, setReceiptTransactions] = useState<JobCardTransaction[]>([]);
  const [issueTransactions, setIssueTransactions] = useState<JobCardTransaction[]>([]);
  const [issueRows, setIssueRows] = useState<IssueRow[]>([]);
  const [balanceWeight, setBalanceWeight] = useState<number | string | undefined>(undefined);
  const [balanceFineWeight, setBalanceFineWeight] = useState<number | string | undefined>(undefined);
  const [issuedWeight, setIssuedWeight] = useState<number | string | undefined>(undefined);
  const [cardFlow, setCardFlow] = useState<CardFlowStep[] | undefined>(undefined);
  const [nextDepartmentGroup, setNextDepartmentGroup] = useState<string | undefined>(undefined);
  const [nextDepartment, setNextDepartment] = useState<string | undefined>(undefined);
  const [auditData, setAuditData] = useState<{
    created_by?: string;
    created_at?: string;
    modified_at?: string;
  }>({});

  const [receiptDetailName, setReceiptDetailName] = useState<string | null>(null);
  const [issueDetailName, setIssueDetailName] = useState<string | null>(null);
  const [issueEditDraft, setIssueEditDraft] = useState<IssueRow | null>(null);
  const [issueModalSaving, setIssueModalSaving] = useState(false);
  const [issueDetailIndex, setIssueDetailIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setDataLoading(true);
      try {
        const decodedId = decodeURIComponent(id);
        const [entityRes, products, purities, departments, karigars, items] = await Promise.all([
          getEntity(ENTITY_NAME, decodedId),
          getEntityReferenceOptions('product', 'product_name', 'product_name'),
          getEntityReferenceOptions('purity', 'purity', 'purity'),
          getEntityReferenceOptions('department', 'name', 'name'),
          getEntityReferenceOptions('karigar', 'karigar', 'karigar'),
          getEntityReferenceOptions('item', 'item_name', 'item_name'),
        ]);

        if (entityRes.data && typeof entityRes.data === 'object') {
          const entity = entityRes.data as Record<string, unknown>;
          const transactions = (entity.transactions as JobCardTransaction[]) ?? [];
          const receipts = (entity.receipts as JobCardTransaction[] | undefined) ?? transactions.filter((tx) => String(tx.transaction_type).trim() === RECEIPT_TYPE);
          const issues = (entity.issues as JobCardTransaction[] | undefined) ?? transactions.filter((tx) => String(tx.transaction_type).trim() === ISSUE_TYPE);
          const productName = String(entity.product ?? '');
          setEntityName(String(entity.name ?? decodedId));
          setInitialData({
            name: String(entity.name ?? ''),
            product: productName,
            parent_melting_lot: String(entity.parent_melting_lot ?? ''),
            melting_lot: String(entity.melting_lot ?? ''),
            purity: String(entity.purity ?? ''),
            department: String(entity.department ?? ''),
            department_group: String(entity.department_group ?? ''),
            design: String(entity.design ?? ''),
            previous_job_card: String(entity.previous_job_card ?? ''),
            qty: entity.qty != null ? String(entity.qty) : '',
            karigar: entity.karigar ? String(entity.karigar) : '',
            description: entity.description ? String(entity.description) : '',
          });
          setReceiptTransactions(receipts);
          setIssueTransactions(issues);

          // If no issues exist, create a default row from job card details
          if (issues.length === 0) {
            const defaultIssueRow: IssueRow = {
              item: '', // Leave empty for user to select from item dropdown
              weight: '',
              fine_weight: '',
              karigar: (entity as any)?.karigar ? String(entity.karigar) : '',
              qty: (entity as any)?.qty != null ? String(entity.qty) : '',
              design: (entity as any)?.design ? String(entity.design) : '',
              purity: (entity as any)?.purity ? String(entity.purity) : '',
            };
            setIssueRows([defaultIssueRow]);
          } else {
            setIssueRows(issues.map(toIssueRow));
          }
          setBalanceWeight(entity.balance_weight as number | string | undefined);
          setBalanceFineWeight(entity.balance_fine_weight as number | string | undefined);
          setIssuedWeight(
            entity.issued_weight != null
              ? (entity.issued_weight as number | string)
              : computeIssuedWeight(issues)
          );
          setCardFlow(entity.card_flow as CardFlowStep[] | undefined);
          setNextDepartmentGroup(entity.next_department_group as string | undefined);
          setNextDepartment(entity.next_department as string | undefined);
          setAuditData({
            created_by: entity.created_by as string | undefined,
            created_at: entity.created_at as string | undefined,
            modified_at: entity.modified_at as string | undefined,
          });

          if (productName) {
            const designs = await getEntityReferenceOptionsFiltered('design', productName, 'design_name', 'design_name');
            setDesignOptions(designs);
          } else {
            setDesignOptions([]);
          }
        }

        setProductOptions(products);
        setPurityOptions(purities);
        setDepartmentOptions(departments);
        setKarigarOptions(karigars);
        setItemOptions(items);
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
        const payload: Record<string, unknown> = {
          name: data.name,
          product: data.product,
          parent_melting_lot: data.parent_melting_lot || '',
          melting_lot: data.melting_lot,
          purity: data.purity,
          department: data.department,
          department_group: data.department_group,
          design: data.design,
          previous_job_card: data.previous_job_card || '',
          qty: data.qty.trim() ? parseInt(data.qty, 10) : 0,
          karigar: data.karigar || '',
          description: data.description || '',
        };

        const response = await updateEntity(ENTITY_NAME, decodeURIComponent(id), payload);

        if (response.success) {
          invalidateEntityListCache(ENTITY_NAME);
          bumpVersion(ENTITY_NAME);
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
    [navigate, entityConfig, id, bumpVersion]
  );

  const handleCancel = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const handleAddIssueRow = useCallback(() => {
    setIssueRows((prev) => [
      ...prev,
      {
        item: '',
        weight: '',
        fine_weight: '',
        karigar: '',
        qty: '',
        design: '',
        purity: '',
      },
    ]);
  }, []);

  const handleDeleteIssueRow = useCallback(
    (index: number) => {
      setIssueRows((prev) => {
        const row = prev[index];
        const name = row?.name;
        if (name) {
          deleteIssueTransaction(name)
            .then(() => {
              setIssueTransactions((txs) =>
                txs.filter((t) => t.name !== name)
              );
              toast.success('Issue transaction deleted successfully');
            })
            .catch((err) => {
              const msg =
                err instanceof Error
                  ? err.message
                  : 'Failed to delete issue transaction';
              showErrorToastUnlessAuth(msg);
            });
        }
        return prev.filter((_, i) => i !== index);
      });
    },
    []
  );

  const cardWrapperClass = `p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
    }`;

  const headerClass = getSectionHeaderClass(isDarkMode);

  const receiptDetail = receiptDetailName != null
    ? receiptTransactions.find((r) => r.name === receiptDetailName)
    : null;

  const issueDetail =
    issueDetailName != null
      ? issueTransactions.find((t) => t.name === issueDetailName) ?? null
      : null;

  useEffect(() => {
    if (issueDetailName != null) {
      const row =
        issueDetailIndex != null
          ? issueRows[issueDetailIndex] ?? null
          : issueRows.find((r) => r.name === issueDetailName);
      const full = issueTransactions.find((t) => t.name === issueDetailName);
      setIssueEditDraft(row ? { ...row } : full ? toIssueRow(full) : null);
    } else {
      setIssueEditDraft(null);
    }
  }, [issueDetailName, issueDetailIndex, issueRows, issueTransactions]);

  const handleSaveIssueModal = useCallback(async () => {
    if (!issueEditDraft || !entityName) return;

    const weightNumber = parseFloat(issueEditDraft.weight ?? '');
    const qtyNumber = issueEditDraft.qty
      ? parseInt(issueEditDraft.qty, 10)
      : 0;
    const item = issueEditDraft.item ?? '';

    if (!item || Number.isNaN(weightNumber) || weightNumber <= 0) {
      showErrorToastUnlessAuth(
        !item
          ? 'Item is required'
          : 'Weight must be a positive number'
      );
      return;
    }

    setIssueModalSaving(true);
    try {
      const tx = await createIssueTransaction({
        job_card: entityName,
        item,
        weight: weightNumber,
        design: issueEditDraft.design || undefined,
        karigar: issueEditDraft.karigar || undefined,
        qty: qtyNumber,
      });

      setIssueTransactions((prev) => {
        const idx = prev.findIndex((t) => t.name === tx.name);
        if (idx === -1) return [...prev, tx];
        const next = [...prev];
        next[idx] = tx;
        return next;
      });

      setIssueRows((prev) => {
        const rowFromTx = toIssueRow(tx);

        if (issueDetailIndex != null && issueDetailIndex >= 0 && issueDetailIndex < prev.length) {
          const next = [...prev];
          next[issueDetailIndex] = rowFromTx;
          return next;
        }

        if (issueDetailName) {
          const idxByDetail = prev.findIndex(
            (r) => r.name === issueDetailName
          );
          if (idxByDetail !== -1) {
            const next = [...prev];
            next[idxByDetail] = rowFromTx;
            return next;
          }
        }

        const idxByName = prev.findIndex((r) => r.name === tx.name);
        if (idxByName !== -1) {
          const next = [...prev];
          next[idxByName] = rowFromTx;
          return next;
        }

        return [...prev, rowFromTx];
      });

      toast.success('Issue transaction saved successfully');
      setIssueDetailName(null);
      setIssueDetailIndex(null);
      setIssueEditDraft(null);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to save issue transaction';
      showErrorToastUnlessAuth(msg);
    } finally {
      setIssueModalSaving(false);
    }
  }, [entityName, issueDetailName, issueDetailIndex, issueEditDraft]);

  // Validation functions
  const validateWeight = (value: string): string | null => {
    if (value === '') return null;
    // Allow numbers with up to 4 decimal places, max 18 digits total
    const weightRegex = /^\d{0,14}(\.\d{0,4})?$/;
    if (!weightRegex.test(value)) {
      return 'Weight must be numeric with max 4 decimal places (18,4)';
    }
    const num = parseFloat(value);
    if (num < 0) {
      return 'Weight must be positive';
    }
    return null;
  };

  const validateQty = (value: string): string | null => {
    if (value === '') return null;
    // Allow max 4 digits, no decimals
    const qtyRegex = /^\d{0,4}$/;
    if (!qtyRegex.test(value)) {
      return 'Quantity must be max 4 digits';
    }
    const num = parseInt(value, 10);
    if (num < 0) {
      return 'Quantity must be positive';
    }
    return null;
  };

  const handleIssueCellChange = useCallback(
    (index: number, key: string, value: string) => {
      // Validate input
      if (key === 'weight') {
        const validationError = validateWeight(value);
        if (validationError) {
          // Don't update the value if invalid
          return;
        }
      }

      if (key === 'qty') {
        const validationError = validateQty(value);
        if (validationError) {
          // Don't update the value if invalid
          return;
        }
      }

      setIssueRows((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const next = [...prev];
        const current = { ...next[index] };

        (current as Record<string, string>)[key] = value;

        if (key === 'weight' || key === 'purity') {
          const weightStr =
            key === 'weight' ? value : String(current.weight ?? '');
          const purityStr =
            key === 'purity' ? value : String(current.purity ?? '');

          const w = parseFloat(weightStr);
          const p = parseFloat(purityStr);

          const fine =
            !Number.isNaN(w) && w > 0 && !Number.isNaN(p) && p > 0
              ? (w * p) / 100
              : NaN;

          const fineWeightStr = !Number.isNaN(fine) && fine > 0 ? fine.toFixed(4) : '';
          (current as Record<string, string>)['fine_weight'] = fineWeightStr;
        }

        next[index] = current;
        return next;
      });
    },
    [validateWeight, validateQty]
  );

  const modalLabelClass = `block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`;
  const modalInputClass = (readOnly?: boolean) =>
    `w-full min-h-[42px] px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-0 ${readOnly
      ? isDarkMode
        ? 'bg-gray-700/30 border-gray-600 text-gray-300'
        : 'bg-gray-100 border-gray-200 text-gray-700'
      : isDarkMode
        ? 'bg-gray-700/50 border-gray-600 text-white'
        : 'bg-white border-gray-300 text-gray-900'
    }`;
  const modalFieldGridClass = 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4';

  const sectionHeadingClass = `text-lg font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
    }`;
  const modalFooterClass = `flex items-center justify-end gap-3 pt-4 mt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
    }`;
  const cancelBtnClass = `px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    }`;
  const saveBtnClass = `px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
    } disabled:opacity-60`;
  const closeBtnClass = `px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    }`;

  const issueColumns: ColumnDef<IssueRow>[] = [
    {
      key: 'item',
      header: 'Item',
      isDropdown: true,
      dropdownOptions: itemOptions,
      width: 'w-40',
    },
    {
      key: 'weight',
      header: 'Weight (G)',
      isEditable: true,
      width: 'w-32',
    },
    {
      key: 'fine_weight',
      header: 'Fine WT (G)',
      isEditable: true,
      width: 'w-32',
    },
    {
      key: 'karigar',
      header: 'Karigar',
      isDropdown: true,
      dropdownOptions: karigarOptions,
      width: 'w-32',
    },
    {
      key: 'qty',
      header: 'Qty',
      isEditable: true,
      width: 'w-24',
    },
    {
      key: 'design',
      header: 'Design',
      isDropdown: true,
      dropdownOptions: designOptions,
      width: 'w-32',
    },
    {
      key: 'purity',
      header: 'Purity',
      isDropdown: true,
      dropdownOptions: purityOptions,
    },
  ];

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
    <div className={`w-full relative ${!isDarkMode ? 'bg-[#F5F2EE] min-h-[calc(100vh-8rem)]' : ''}`}>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
          { label: `Edit ${entityName || decodeURIComponent(id)}` },
        ]}
        className="mb-4"
      />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
          >
            Edit {entityConfig.displayName}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Update {entityConfig.displayName.toLowerCase()} details below.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Card Details */}
          <div className={cardWrapperClass}>
            <h2 className={headerClass + ' pb-2 border-b'}>
              Job Card Details
            </h2>
            <JobCardForm
              initialData={initialData ?? undefined}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              isEdit={true}
              productOptions={productOptions}
              purityOptions={purityOptions}
              departmentOptions={departmentOptions}
              designOptions={designOptions}
              karigarOptions={karigarOptions}
            />
          </div>

          {/* Receipt Weights */}
          <div className={cardWrapperClass}>
            <h2 className={headerClass + ' pb-2 border-b'}>
              Receipt
            </h2>
            {receiptTransactions.length > 0 ? (
              <JobCardReadOnlyTable
                columns={[
                  { key: 'item', header: 'Item' },
                  { key: 'weight', header: 'Weight (G)' },
                  { key: 'fine_weight', header: 'Fine Weight (G)' },
                  { key: 'purity', header: 'Purity', type: 'link' },
                  { key: 'name', header: 'Ref', type: 'link' },
                  { key: 'created_at', header: 'Date', type: 'date' },
                ]}
                rows={receiptTransactions as unknown as Record<string, unknown>[]}
                getLinkHref={(row, key) => {
                  if (key === 'name' && row.name) {
                    return jobCardTransactionConfig.routes.detail.replace(':id', encodeURIComponent(String(row.name)));
                  }
                  if (key === 'purity' && row.purity) {
                    return getEntityDetailRoute('purity', row.purity) ?? null;
                  }
                  return null;
                }}
                formatDate={(val) => (val ? formatDateTime(String(val)) : '–')}
                isDarkMode={isDarkMode}
                rowKey={(row) => String(row.name ?? '')}
                renderActions={(row) => (
                  <button
                    type="button"
                    onClick={() => setReceiptDetailName(String(row.name ?? ''))}
                    className={`p-1.5 rounded transition-colors ${isDarkMode ? 'text-blue-400 hover:bg-blue-500/20' : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    title="View details"
                    aria-label="View receipt details"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                )}
              />
            ) : (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No receipt transactions.
              </p>
            )}
          </div>

          {/* Issue Balance */}
          <div className={cardWrapperClass}>
            <h2 className={headerClass + ' pb-2 border-b'}>
              Issue
            </h2>
            <EditableWeightTable<IssueRow>
              columns={issueColumns}
              data={issueRows}
              onDataChange={setIssueRows}
              readOnly={false}
              showAddButton={true}
              showTotals={false}
              showActions={true}
              onAddRow={handleAddIssueRow}
              onDeleteRow={handleDeleteIssueRow}
              onCellChange={handleIssueCellChange}
              getRowId={(_, index) => index}
              renderActions={(row) => (
                <button
                  type="button"
                  onClick={() => {
                    const idx = issueRows.indexOf(row);
                    setIssueDetailIndex(idx >= 0 ? idx : null);
                    setIssueDetailName(String(row.name ?? ''));
                  }}
                  className={`p-1.5 rounded transition-colors ${isDarkMode ? 'text-blue-400 hover:bg-blue-500/20' : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  title="View details"
                  aria-label="View issue details"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
            />
          </div>
        </div>

        {/* Right column: sidebar */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-[var(--header-height)] lg:self-start lg:max-h-[calc(100vh-var(--header-height))] lg:overflow-y-auto lg:pb-4 scrollbar-hide">
          {/* Live Balance */}
          <div
            className={
              isDarkMode
                ? 'p-6 rounded-xl border border-gray-700 bg-gray-800'
                : 'p-6 rounded-xl border border-gray-200 shadow-sm bg-[#FDF5E6] border-t-4'
            }
          >
            <h2
              className={
                isDarkMode
                  ? 'text-sm font-semibold uppercase tracking-wider text-white pb-2 border-b border-gray-600'
                  : 'text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-amber-900'
              }
            >
              {!isDarkMode && <span className="w-2 h-2 rounded-full bg-[#B87820] shrink-0" aria-hidden />}
              Live Balance
            </h2>
            <div className={`space-y-3 border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-amber-200'}`}>
              <div>
                <p className={isDarkMode ? 'block text-sm font-medium mb-1 text-gray-400' : 'block text-sm font-semibold mb-1 text-amber-800'}>
                  Balance Weight
                </p>
                <p
                  className={
                    isDarkMode
                      ? 'text-base font-semibold text-white'
                      : 'text-lg font-semibold text-[#B87820]'
                  }
                >
                  {formatBalance(balanceWeight)}
                </p>
              </div>
              <div>
                <p className={isDarkMode ? 'block text-sm font-medium mb-1 text-gray-400' : 'block text-sm font-semibold mb-1 text-amber-800'}>
                  Balance Fine Weight
                </p>
                <p
                  className={
                    isDarkMode
                      ? 'text-base font-semibold text-white'
                      : 'text-lg font-semibold text-[#B87820]'
                  }
                >
                  {formatBalance(balanceFineWeight)}
                </p>
              </div>
              <div>
                <p className={isDarkMode ? 'block text-sm font-medium mb-1 text-gray-400' : 'block text-sm font-semibold mb-1 text-amber-800'}>
                  Issued Weight
                </p>
                <p
                  className={
                    isDarkMode
                      ? 'text-base font-semibold text-white'
                      : 'text-lg font-semibold text-[#B87820]'
                  }
                >
                  {formatBalance(issuedWeight)}
                </p>
              </div>
            </div>
          </div>

          {/* Card Flow */}
          <div
            className={
              isDarkMode
                ? 'p-6 rounded-xl border border-gray-700 bg-gray-800'
                : 'p-6 rounded-xl border border-gray-200 shadow-sm bg-[#FDF5E6] border-t-4'
            }
          >
            <h2
              className={
                isDarkMode
                  ? 'text-sm font-semibold uppercase tracking-wider text-white pb-2 border-b border-gray-600'
                  : 'text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-amber-900'
              }
            >
              {!isDarkMode && <span className="w-2 h-2 rounded-full bg-[#B87820] shrink-0" aria-hidden />}
              Card Flow
            </h2>
            <div className={`space-y-3 border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-amber-200'}`}>
              {/* Next Department Info */}
              {(nextDepartmentGroup || nextDepartment) && (
                <>
                  {nextDepartmentGroup && (
                    <div>
                      <p className={isDarkMode ? 'block text-sm font-medium mb-1 text-gray-400' : 'block text-sm font-semibold mb-1 text-amber-800'}>
                        Next Department Group
                      </p>
                      <p className={isDarkMode ? 'text-base font-semibold text-white' : 'text-lg font-semibold text-[#B87820]'}>
                        {(() => {
                          const deptGroupRoute = getEntityDetailRoute('department_group', nextDepartmentGroup);
                          return deptGroupRoute ? (
                            <Link to={deptGroupRoute} className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-[#B87820] hover:text-[#B87820]/80'}>
                              {nextDepartmentGroup}
                            </Link>
                          ) : (
                            <span>{nextDepartmentGroup}</span>
                          );
                        })()}
                      </p>
                    </div>
                  )}
                  {nextDepartment && (
                    <div>
                      <p className={isDarkMode ? 'block text-sm font-medium mb-1 text-gray-400' : 'block text-sm font-semibold mb-1 text-amber-800'}>
                        Next Department
                      </p>
                      <p className={isDarkMode ? 'text-base font-semibold text-white' : 'text-lg font-semibold text-[#B87820]'}>
                        {(() => {
                          const deptRoute = getEntityDetailRoute('department', nextDepartment);
                          return deptRoute ? (
                            <Link to={deptRoute} className={isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-[#B87820] hover:text-[#B87820]/80'}>
                              {nextDepartment}
                            </Link>
                          ) : (
                            <span>{nextDepartment}</span>
                          );
                        })()}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Existing Card Flow Steps */}
              {cardFlow && cardFlow.length > 0 ? (
                <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-600' : 'border-amber-200'}`}>
                  <p className={isDarkMode ? 'block text-sm font-medium mb-3 text-gray-400' : 'block text-sm font-semibold mb-3 text-amber-800'}>
                    Flow Steps
                  </p>
                  <div className={`ml-1 pl-4 border-l-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} space-y-3`}>
                    {cardFlow.map((step, idx) => {
                      const deptRoute = step.department ? getEntityDetailRoute('department', step.department) : null;
                      const deptGroupRoute = step.department_group ? getEntityDetailRoute('department_group', step.department_group) : null;
                      const linkClass = isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700';
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          {step.completed ? (
                            <span
                              className={`shrink-0 mt-0.5 flex items-center justify-center rounded-lg ${isDarkMode ? 'text-green-500' : 'bg-teal-100 text-teal-600 p-0.5'}`}
                              aria-hidden
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          ) : (
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                }`}
                            >
                              {idx + 1}
                            </span>
                          )}
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              {step.label ?? step.department ?? 'Step'}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {step.department != null && step.department_group != null && (
                                <>
                                  {deptRoute ? (
                                    <Link to={deptRoute} className={linkClass}>{step.department}</Link>
                                  ) : (
                                    step.department
                                  )}
                                  {' · '}
                                  {deptGroupRoute ? (
                                    <Link to={deptGroupRoute} className={linkClass}>{step.department_group}</Link>
                                  ) : (
                                    step.department_group
                                  )}
                                </>
                              )}
                              {step.department != null && !step.department_group && (
                                deptRoute ? (
                                  <Link to={deptRoute} className={linkClass}>{step.department}</Link>
                                ) : (
                                  step.department
                                )
                              )}
                              {step.department_group != null && !step.department && (
                                deptGroupRoute ? (
                                  <Link to={deptGroupRoute} className={linkClass}>{step.department_group}</Link>
                                ) : (
                                  step.department_group
                                )
                              )}
                              {!step.department && !step.department_group && 'Not assigned'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : !nextDepartmentGroup && !nextDepartment ? (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Not assigned
                </p>
              ) : null}
            </div>
          </div>

          {/* Audit */}
          {/* <div className={cardWrapperClass}>
            <h2
              className={
                isDarkMode
                  ? headerClass
                  : 'text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-gray-900'
              }
            >
              {!isDarkMode && <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" aria-hidden />}
              Audit
            </h2>
            <div className={`border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className={`flex justify-between items-baseline py-2 ${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created By</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {auditData.created_by ?? '–'}
                </span>
              </div>
              <div className={`flex justify-between items-baseline py-2 ${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created At</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {auditData.created_at ? formatDateTime(auditData.created_at) : '–'}
                </span>
              </div>
              <div className={`flex justify-between items-baseline py-2 ${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Modified At</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {auditData.modified_at ? formatDateTime(auditData.modified_at) : '–'}
                </span>
              </div>
            </div>
          </div> */}

        </div>
      </div>

      {/* Receipt detail modal – eye opens, all data as input fields (read-only), like Configurations */}
      <Modal
        isOpen={receiptDetailName != null}
        onClose={() => setReceiptDetailName(null)}
        title={receiptDetail ? `Receipt: ${receiptDetail.name}` : 'Receipt details'}
        size="lg"
        className="w-full max-w-4xl"
      >
        {receiptDetail ? (
          <>
            <h2 className={sectionHeadingClass}>Receipt</h2>
            <div className={modalFieldGridClass}>
              <div>
                <label className={modalLabelClass}>Name</label>
                <input type="text" readOnly value={receiptDetail.name ?? ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Transaction Type</label>
                <input type="text" readOnly value={receiptDetail.transaction_type ?? ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Job Card</label>
                <input type="text" readOnly value={receiptDetail.job_card ?? ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Item</label>
                <input type="text" readOnly value={receiptDetail.item ?? ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Weight</label>
                <input type="text" readOnly value={receiptDetail.weight ?? ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Fine Weight</label>
                <input type="text" readOnly value={receiptDetail.fine_weight ?? ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Karigar</label>
                <input type="text" readOnly value={receiptDetail.karigar ?? ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Purity</label>
                <input type="text" readOnly value={receiptDetail.purity ?? ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Qty</label>
                <input type="text" readOnly value={receiptDetail.qty ?? ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Created At</label>
                <input type="text" readOnly value={receiptDetail.created_at ? formatDateTime(receiptDetail.created_at) : ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Modified At</label>
                <input type="text" readOnly value={receiptDetail.modified_at ? formatDateTime(receiptDetail.modified_at) : ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Created By</label>
                <input type="text" readOnly value={receiptDetail.created_by ?? ''} className={modalInputClass(true)} />
              </div>
              <div>
                <label className={modalLabelClass}>Modified By</label>
                <input type="text" readOnly value={receiptDetail.modified_by ?? ''} className={modalInputClass(true)} />
              </div>
            </div>
            <div className={modalFooterClass}>
              <button type="button" onClick={() => setReceiptDetailName(null)} className={closeBtnClass}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Receipt not found.</p>
            <div className={modalFooterClass}>
              <button type="button" onClick={() => setReceiptDetailName(null)} className={closeBtnClass}>
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Issue detail modal – eye opens, all data as input fields, editable; Save updates row locally */}
      <Modal
        isOpen={issueDetailName != null}
        onClose={() => { setIssueDetailName(null); setIssueDetailIndex(null); setIssueEditDraft(null); }}
        title={issueDetail ? `Issue: ${issueDetail.name}` : issueEditDraft?.name ? `Issue: ${issueEditDraft.name}` : 'Issue details'}
        size="lg"
        className="w-full max-w-4xl"
      >
        {issueEditDraft ? (
          <>
            <h2 className={sectionHeadingClass}>Issue</h2>
            <div className={modalFieldGridClass}>
              <div>
                <label className={modalLabelClass}>Item</label>
                <FormSelect
                  value={issueEditDraft.item ?? ''}
                  onChange={(v) => setIssueEditDraft((p) => (p ? { ...p, item: v } : null))}
                  options={itemOptions}
                  placeholder="Select Item"
                  isDarkMode={isDarkMode}
                />
              </div>
              <div>
                <label className={modalLabelClass}>Weight</label>
                <input
                  type="text"
                  value={issueEditDraft.weight ?? ''}
                  onChange={(e) => {
                    const newWeight = e.target.value;
                    setIssueEditDraft((p) => {
                      if (!p) return null;
                      const w = parseFloat(newWeight);
                      const puritySource =
                        p.purity ??
                        (issueDetail?.purity != null
                          ? String(issueDetail.purity)
                          : '');
                      const pVal = parseFloat(puritySource);
                      const fine =
                        !Number.isNaN(w) && w > 0 && !Number.isNaN(pVal) && pVal > 0
                          ? (w * pVal) / 100
                          : NaN;
                      const nextFine =
                        !Number.isNaN(fine) && fine > 0 ? fine.toFixed(4) : '';
                      return { ...p, weight: newWeight, fine_weight: nextFine };
                    });
                  }}
                  className={modalInputClass()}
                />
              </div>
              <div>
                <label className={modalLabelClass}>Fine Weight</label>
                <input
                  type="text"
                  value={issueEditDraft.fine_weight ?? ''}
                  readOnly
                  className={modalInputClass(true)}
                />
              </div>
              <div>
                <label className={modalLabelClass}>Karigar</label>
                <FormSelect
                  value={issueEditDraft.karigar ?? ''}
                  onChange={(v) => setIssueEditDraft((p) => (p ? { ...p, karigar: v } : null))}
                  options={karigarOptions}
                  placeholder="Select Karigar"
                  isDarkMode={isDarkMode}
                />
              </div>
              <div>
                <label className={modalLabelClass}>Qty</label>
                <input
                  type="text"
                  value={issueEditDraft.qty ?? ''}
                  onChange={(e) => setIssueEditDraft((p) => (p ? { ...p, qty: e.target.value } : null))}
                  className={modalInputClass()}
                />
              </div>
              <div>
                <label className={modalLabelClass}>Design</label>
                <FormSelect
                  value={issueEditDraft.design ?? ''}
                  onChange={(v) => setIssueEditDraft((p) => (p ? { ...p, design: v } : null))}
                  options={designOptions}
                  placeholder="Select Design"
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
            <div className={modalFooterClass}>
              <button type="button" onClick={() => { setIssueDetailName(null); setIssueDetailIndex(null); setIssueEditDraft(null); }} className={cancelBtnClass}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveIssueModal} className={saveBtnClass} disabled={issueModalSaving}>
                Save
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Issue not found.</p>
            <div className={modalFooterClass}>
              <button type="button" onClick={() => { setIssueDetailName(null); setIssueDetailIndex(null); setIssueEditDraft(null); }} className={closeBtnClass}>
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

      <div className="flex items-center justify-end gap-3 shrink-0 mt-6">
        <BackButton onClick={handleCancel} />
        <button
          type="button"
          onClick={handleCancel}
          className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode
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
          className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-60`}
        >
          {isLoading ? 'Saving...' : 'Update'}
        </button>
      </div>
    </div>
  );
}
