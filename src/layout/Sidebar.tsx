import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/ui.store';
import { useAuthStore } from '../auth/auth.store';
import { logout as logoutApi } from '../auth/auth.api';
import { showErrorToastUnlessAuth } from '../shared/utils/errorHandling';
import { sidebarNavConfig, type NavCategory, type NavItem } from '../config/navigation.config';

type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

interface SidebarProps {
  mode: SidebarMode;
  onCollapseToggle: () => void;
  onMobileClose: () => void;
}

// ─── Icon Registry ────────────────────────────────────────────────────────────
const NavIcon = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, React.ReactElement> = {
    dashboard: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" /></svg>,
    home: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    database: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
    package: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    receipt: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    'file-text': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    'users-cog': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    clipboard: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    calendar: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    users: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    user: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    sparkles: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
    ruler: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>,
    pencil: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
    box: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    layers: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    cog: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    tag: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
    key: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
    list: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    file: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    archive: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
    search: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    shield: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    default: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" strokeWidth={1.75} /></svg>,
  };
  return icons[name] ?? icons['default'];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isItemActive(currentPath: string, itemPath: string): boolean {
  if (currentPath === itemPath) return true;
  if (itemPath === '/') return false;
  return currentPath.startsWith(itemPath + '/');
}

// ─── Collapsed Category Popup ─────────────────────────────────────────────────
// Hover-to-open: expandable wrapper keeps cursor inside hover zone when moving from icon to popup.
function CollapsedCategoryPopup({
  category,
  currentPath,
  isDarkMode,
}: {
  category: NavCategory;
  currentPath: string;
  isDarkMode: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const open = () => {
    setVisible(true);
    setAnimateIn(false);
  };
  const close = () => {
    setAnimateIn(false);
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateIn(true));
    });
    return () => cancelAnimationFrame(id);
  }, [visible]);

  if (category.items.length === 0) {
    return (
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
      >
        <NavIcon name={category.icon} className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center transition-all duration-150 ${visible ? 'min-w-[240px]' : 'w-10'}`}
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 ease-out flex-shrink-0 ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
          }`}
      >
        <NavIcon name={category.icon} className="w-5 h-5" />
      </div>
      {visible && (
        <>
          <div className="w-[200px] h-10 flex-shrink-0" aria-hidden />
          <div
            className={`absolute left-14 top-0 z-50 min-w-[180px] rounded-l-none rounded-r-xl border-l-0 border shadow-lg py-2 flex flex-col
            transition-all duration-200 ease-out
            ${animateIn ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-1'}
            ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}
        >
          <p
            className={`px-3 pb-1 flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
          >
            {category.category}
          </p>
          <div
            className={`overflow-y-auto scrollbar-none ${category.items.length > 8 ? 'max-h-64' : ''}`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            {category.items.map((item) => {
              const active = isItemActive(currentPath, item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-all duration-200 ease-out ${active
                      ? isDarkMode
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-amber-600 bg-amber-500/10'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  {item.icon && <NavIcon name={item.icon} className="w-4 h-4 flex-shrink-0" />}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
}

// ─── Expanded Menu Category ───────────────────────────────────────────────────
function MenuCategory({
  category,
  isDarkMode,
  currentPath,
}: {
  category: NavCategory;
  isDarkMode: boolean;
  currentPath: string;
}) {
  const hasActiveChild = category.items.some((item) => isItemActive(currentPath, item.path));
  const [isOpen, setIsOpen] = useState(category.defaultOpen || hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setIsOpen(true);
  }, [currentPath, hasActiveChild]);

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out ${isDarkMode
            ? 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
      >
        <NavIcon name={category.icon} className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{category.category}</span>
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ease-out ${isOpen ? 'rotate-90' : ''} ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-[max-height] duration-300 ease-out ${isOpen ? 'max-h-[60vh]' : 'max-h-0'}`}>
        <div
          className={`ml-4 mt-0.5 mb-1 pl-3 border-l scrollbar-none overflow-y-auto max-h-[55vh] space-y-0.5 transition-opacity duration-200 ease-out delay-75 ${isDarkMode ? 'border-gray-700/80' : 'border-gray-200'} ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {category.items.map((item: NavItem) => {
            const active = isItemActive(currentPath, item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 ease-out ${active
                    ? isDarkMode
                      ? 'bg-amber-500/15 text-amber-400 font-medium'
                      : 'bg-amber-500/10 text-amber-600 font-medium'
                    : isDarkMode
                      ? 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
              >
                {item.icon && <NavIcon name={item.icon} className="w-4 h-4 flex-shrink-0" />}
                <span className="truncate">{item.name}</span>
                {active && (
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-amber-400' : 'bg-amber-500'}`} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar({ mode, onCollapseToggle, onMobileClose: _onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const [search, setSearch] = useState('');

  if (location.pathname === '/login' || location.pathname === '/signUp') return null;

  const isExpanded = mode === 'expanded';
  const isVisible = mode !== 'hidden';

  const handleLogout = async () => {
    if (token) {
      try {
        await logoutApi(token);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        showErrorToastUnlessAuth(msg);
      }
    }
    logout();
    navigate('/login', { replace: true });
  };

  const filteredNav = search.trim()
    ? sidebarNavConfig
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : sidebarNavConfig;

  const sidebarBg = isDarkMode
    ? 'bg-gray-900 border-gray-800'
    : 'bg-white border-gray-200';

  return (
    <aside
      className={`fixed left-0 z-40 top-[6.75rem] h-[calc(100vh-6.75rem)] border-r flex flex-col
        transition-all duration-300 ease-out
        ${sidebarBg}
        ${isVisible ? 'translate-x-0' : '-translate-x-full'}
        ${isExpanded ? 'w-64' : 'w-16'}
      `}
    >
      {/* ── Floating edge collapse toggle ── */}
      <button
        onClick={onCollapseToggle}
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        className={`absolute -right-3 top-6 z-50 w-6 h-6 flex items-center justify-center
          rounded-full border shadow-md
          transition-all duration-200 ease-out
          ${isDarkMode
            ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 hover:border-gray-600'
            : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
          }`}
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ease-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* ── Search ── */}
      <div className={`flex-shrink-0 pl-3 pr-10 pt-4 pb-2 ${!isExpanded ? 'hidden' : ''}`}>
        <div
          className={`flex items-center gap-2 pl-3 pr-3 py-2.5 rounded-xl border text-sm
            transition-colors duration-200 ease-out
            ${isDarkMode
              ? 'bg-gray-800/60 border-gray-700 text-gray-400 placeholder-gray-600 focus-within:border-gray-600'
              : 'bg-gray-50 border-gray-200 text-gray-500 focus-within:border-gray-300'
            }`}
        >
          <NavIcon name="search" className="w-4 h-4 flex-shrink-0 text-current" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className={`flex-1 bg-transparent outline-none text-sm min-w-0 ${isDarkMode ? 'text-gray-200 placeholder-gray-600' : 'text-gray-700 placeholder-gray-400'
              }`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className={`flex-shrink-0 p-0.5 rounded-md transition-colors duration-200 ease-out ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Collapsed: search icon only */}
      {!isExpanded && (
        <div className="flex-shrink-0 flex justify-center py-2">
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors duration-200 ease-out ${isDarkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/60' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <NavIcon name="search" className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav
        className={`flex-1 py-2 scrollbar-none ${isExpanded ? 'overflow-y-auto' : 'overflow-visible'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {isExpanded ? (
          <div className="px-2 space-y-0.5">
            {filteredNav.map((category) => (
              <MenuCategory
                key={category.id}
                category={category}
                isDarkMode={isDarkMode}
                currentPath={location.pathname}
              />
            ))}
            {filteredNav.length === 0 && (
              <p className={`text-xs text-center py-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                No results
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-1 px-2 py-1">
            {sidebarNavConfig.map((category) => (
              <CollapsedCategoryPopup
                key={category.id}
                category={category}
                currentPath={location.pathname}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        )}
      </nav>

      {/* ── Logout Footer ── */}
      <div className={`flex-shrink-0 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-3.5 transition-colors duration-200 ease-out ${
            isDarkMode ? 'hover:bg-gray-800/60 text-red-400' : 'hover:bg-gray-50 text-red-600'
          } ${isExpanded ? 'justify-start' : 'justify-center'}`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {isExpanded && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
