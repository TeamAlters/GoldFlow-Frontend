import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../auth/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { toast } from '../../stores/toast.store';
import { getEntityFormMetadata, getEntity } from './admin.api';
import type { FormMetadataResponse, FieldGroup, FormFieldMetadata } from './admin.api';
import { getEntityConfig } from '../../config/entity.config';
import { getEntityFormMetadataCache, setEntityFormMetadataCache } from '../../utils/entityCache';

/** Format ISO date-time string for UI (e.g. "31 Jan 2026, 12:37 pm") */
function formatDateTime(isoOrValue: string | number | null | undefined): string {
  if (isoOrValue === null || isoOrValue === undefined) return '—';
  const s = String(isoOrValue).trim();
  if (!s) return '—';
  const date = new Date(s);
  if (Number.isNaN(date.getTime())) return s;
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Format field value based on type */
function formatFieldValue(value: unknown, fieldMeta: FormFieldMetadata): string {
  if (value === null || value === undefined) return '—';
  
  const type = fieldMeta.type.toLowerCase();
  
  // Boolean
  if (type === 'boolean' || type === 'bool') {
    return value ? 'Yes' : 'No';
  }
  
  // DateTime
  if (type === 'datetime' || type === 'timestamp') {
    return formatDateTime(value as string);
  }
  
  // Date
  if (type === 'date') {
    const s = String(value).trim();
    if (!s) return '—';
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return s;
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  
  // Array/List
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—';
  }
  
  // Object
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

// Module-level flags to prevent concurrent fetches (survives StrictMode double-render)
let formMetadataFetchInFlight = false;
let entityDataFetchInFlight = false;

export interface EntityDetailPageProps {
  entityName?: string;
  entityId?: string;
}

export default function EntityDetailPage({ entityName: propEntityName, entityId: propEntityId }: EntityDetailPageProps = {}) {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  // Determine entity name: props > route parsing
  const entityName = propEntityName || location.pathname.split('/')[1]?.replace(/s$/, '') || 'user';
  const id = propEntityId || paramId;
  const entityConfig = getEntityConfig(entityName);

  const [formMetadata, setFormMetadata] = useState<FormMetadataResponse['data'] | null>(null);
  const [entityData, setEntityData] = useState<Record<string, unknown> | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleAuthError = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const showErrorToast = useCallback((msg: string) => {
    toast.error(msg);
  }, []);

  // Fetch form metadata with cache + fallback pattern
  const fetchFormMetadata = useCallback(() => {
    if (formMetadataFetchInFlight) {
      console.log('[GoldFlow] [EntityDetailPage] formMetadata fetch already in flight, skipping');
      return;
    }
    
    formMetadataFetchInFlight = true;
    setMetadataLoading(true);
    
    getEntityFormMetadata(entityName)
      .then((res) => {
        if (res.data) {
          setFormMetadata(res.data);
          // Cache the result
          setEntityFormMetadataCache(entityName, res.data);
          // Expand first group by default
          if (res.data.field_groups && res.data.field_groups.length > 0) {
            setExpandedGroups(new Set([res.data.field_groups[0].id]));
          }
          console.log('[GoldFlow] [EntityDetailPage] formMetadata: from API', { entityName });
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load form metadata';
        if (/credentials|401|validate|unauthorized/i.test(msg)) {
          showErrorToast('Session expired. Please sign in again.');
          handleAuthError();
          return;
        }
        showErrorToast(msg);
      })
      .finally(() => {
        formMetadataFetchInFlight = false;
        setMetadataLoading(false);
      });
  }, [entityName, handleAuthError, showErrorToast]);

  // Load form metadata (check cache first)
  useEffect(() => {
    if (!token) return;
    
    // Check cache first
    const cached = getEntityFormMetadataCache(entityName);
    if (cached) {
      console.log('[GoldFlow] [EntityDetailPage] formMetadata: from cache', {
        entityName,
        cachedAt: cached.fetchedAt,
      });
      setFormMetadata(cached as FormMetadataResponse['data']);
      // Expand first group by default
      if (cached.field_groups && cached.field_groups.length > 0) {
        setExpandedGroups(new Set([cached.field_groups[0].id]));
      }
      setMetadataLoading(false);
      return;
    }
    
    // Cache miss - fetch from API
    fetchFormMetadata();
  }, [token, entityName, fetchFormMetadata]);

  // Fetch entity data
  useEffect(() => {
    if (!token || !id) return;
    
    if (entityDataFetchInFlight) {
      console.log('[GoldFlow] [EntityDetailPage] entityData fetch already in flight, skipping');
      return;
    }
    
    entityDataFetchInFlight = true;
    setDataLoading(true);
    
    getEntity(entityName, id)
      .then((res) => {
        if (res.data) {
          setEntityData(res.data);
          console.log('[GoldFlow] [EntityDetailPage] entityData: loaded', { entityName, id });
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load entity data';
        if (/credentials|401|validate|unauthorized/i.test(msg)) {
          showErrorToast('Session expired. Please sign in again.');
          handleAuthError();
          return;
        }
        showErrorToast(msg);
      })
      .finally(() => {
        entityDataFetchInFlight = false;
        setDataLoading(false);
      });
  }, [token, entityName, id, handleAuthError, showErrorToast]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleBackToList = () => {
    navigate(entityConfig.routes.list);
  };

  // Show loading state while either is loading, or if data hasn't been set yet
  const loading = metadataLoading || dataLoading || !formMetadata || !entityData;

  if (loading) {
    // Show error state if loading is done but data is missing
    if (!metadataLoading && !dataLoading && (!formMetadata || !entityData)) {
      return (
        <div className="w-full">
          <div className="mb-6">
            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Error
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Unable to load entity details
            </p>
          </div>
          <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              The requested entity could not be found or loaded.
            </p>
            <button
              onClick={handleBackToList}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Back to {entityConfig.displayNamePlural}
            </button>
          </div>
        </div>
      );
    }
    
    // Show loading skeleton
    return (
      <div className="w-full">
        <div className="mb-6 animate-pulse">
          <div className={`h-8 w-64 rounded mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
          <div className={`h-4 w-96 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
        </div>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-64 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Header - Matching ListPageLayout */}
      <div className="mb-6">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {formMetadata.display_name} Details
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Viewing detailed information for {formMetadata.display_name}
        </p>
      </div>

      {/* Toolbar - Matching UsersPage style */}
      <div className="mb-4 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <button
              onClick={handleBackToList}
              className={`text-sm transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              ← Back to {entityConfig.displayNamePlural}
            </button>
          </div>
        </div>
      </div>

      {/* Field Groups */}
      <div className="space-y-4">
        {formMetadata.field_groups.map((group: FieldGroup) => {
          const isExpanded = expandedGroups.has(group.id);
          const groupFields = group.fields
            .map((fieldName) => ({
              name: fieldName,
              meta: formMetadata.fields[fieldName],
            }))
            .filter((f) => f.meta);

          return (
            <div
              key={group.id}
              className={`rounded-lg border-2 overflow-hidden ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              {/* Group Header */}
              <button
                onClick={() => group.collapsible && toggleGroup(group.id)}
                className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                  group.collapsible 
                    ? `cursor-pointer ${isDarkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}` 
                    : 'cursor-default'
                } ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                disabled={!group.collapsible}
              >
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {group.label}
                </h2>
                {group.collapsible && (
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Group Content */}
              <div 
                className={`transition-all duration-200 overflow-hidden ${
                  isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupFields.map(({ name, meta }) => {
                      const value = entityData[name];
                      const displayValue = formatFieldValue(value, meta);

                      return (
                        <div key={name} className="flex flex-col">
                          <label
                            className={`text-sm font-semibold mb-2 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            {meta.label}
                            {meta.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <div
                            className={`px-4 py-3 rounded-md ${
                              isDarkMode
                                ? 'bg-gray-700 text-gray-200 border border-gray-600'
                                : 'bg-gray-100 text-gray-900 border border-gray-200'
                            }`}
                          >
                            {displayValue}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
