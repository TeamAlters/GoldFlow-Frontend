import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import SecondNavbar from './SecondNavbar';
import Sidebar from './Sidebar';
import { useUIStore } from '../stores/ui.store';

type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarMode') as SidebarMode | null;
      if (saved === 'expanded' || saved === 'collapsed') return saved;
      return window.innerWidth >= 1024 ? 'collapsed' : 'hidden';
    }
    return 'collapsed';
  });
  const location = useLocation();
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  // On mobile route change, close sidebar
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarMode('hidden');
    }
  }, [location.pathname]);

  // Dynamic sticky offset: measure header height so sidebar (Live Balance, Card Flow, Audit) stays below nav at any zoom.
  // Must run before early return (rules of hooks). ResizeObserver + delayed measurement for reliability.
  useEffect(() => {
    const updateHeaderHeight = () => {
      const el = document.querySelector('[data-header-end]');
      if (el) {
        const bottom = el.getBoundingClientRect().bottom;
        document.documentElement.style.setProperty('--header-height', `${bottom}px`);
      } else {
        document.documentElement.style.setProperty('--header-height', '7.5rem');
      }
    };

    updateHeaderHeight();
    requestAnimationFrame(updateHeaderHeight);
    const timeoutId = window.setTimeout(updateHeaderHeight, 150);

    const headerEl = document.querySelector('[data-header-end]');
    const resizeObserver =
      headerEl && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateHeaderHeight)
        : null;
    if (resizeObserver && headerEl) resizeObserver.observe(headerEl);

    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.clearTimeout(timeoutId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [location.pathname]);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signUp';
  if (isAuthPage) return <>{children}</>;

  const handleMobileToggle = () => {
    setSidebarMode((prev) => (prev === 'hidden' ? 'expanded' : 'hidden'));
  };

  const handleCollapseToggle = () => {
    setSidebarMode((prev) => {
      const next = prev === 'expanded' ? 'collapsed' : 'expanded';
      localStorage.setItem('sidebarMode', next);
      return next;
    });
  };

  const mainMargin =
    sidebarMode === 'expanded'
      ? 'lg:ml-64'
      : sidebarMode === 'collapsed'
        ? 'lg:ml-16'
        : 'ml-0';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-[#F5F2EE]'}`}>
      <Navbar />
      <SecondNavbar
        onToggleSidebar={handleMobileToggle}
        isSidebarOpen={sidebarMode !== 'hidden'}
      />
      <Sidebar
        mode={sidebarMode}
        onCollapseToggle={handleCollapseToggle}
        onMobileClose={() => setSidebarMode('hidden')}
      />
      <main
        className={`pt-28 md:pt-28 transition-[margin] duration-300 ease-in-out ${mainMargin}`}
      >
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
