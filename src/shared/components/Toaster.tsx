import { useEffect, useRef, useState } from 'react';
import { useToastStore } from '../../stores/toast.store';
import type { ToastType } from '../../stores/toast.store';
import { TOAST_DURATION_MS } from '../../stores/toast.store';

const EXIT_DURATION_MS = 250;

const config: Record<
  ToastType,
  { title: string; barClass: string; titleClass: string; icon: React.ReactNode }
> = {
  success: {
    title: 'Success',
    barClass: 'bg-emerald-500',
    titleClass: 'text-emerald-600',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  error: {
    title: 'Error',
    barClass: 'bg-red-500',
    titleClass: 'text-red-600',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  warning: {
    title: 'Warning',
    barClass: 'bg-amber-500',
    titleClass: 'text-amber-600',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  info: {
    title: 'Info',
    barClass: 'bg-blue-500',
    titleClass: 'text-blue-600',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
};

export default function Toaster() {
  const { toasts, removeToast } = useToastStore();
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<
    Map<string, { auto: ReturnType<typeof setTimeout>; exit: ReturnType<typeof setTimeout> }>
  >(new Map());

  const startExit = (id: string) => {
    if (exitingIds.has(id)) return;
    const existing = timersRef.current.get(id);
    if (existing?.auto) clearTimeout(existing.auto);
    timersRef.current.set(id, { ...existing, auto: undefined! } as {
      auto: ReturnType<typeof setTimeout>;
      exit: ReturnType<typeof setTimeout>;
    });
    setExitingIds((prev) => new Set(prev).add(id));
    const exitTimer = setTimeout(() => {
      removeToast(id);
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      timersRef.current.delete(id);
    }, EXIT_DURATION_MS);
    timersRef.current.set(id, { ...timersRef.current.get(id), exit: exitTimer } as {
      auto: ReturnType<typeof setTimeout>;
      exit: ReturnType<typeof setTimeout>;
    });
  };

  useEffect(() => {
    toasts.forEach((toast) => {
      if (timersRef.current.has(toast.id)) return;
      const auto = setTimeout(() => startExit(toast.id), TOAST_DURATION_MS);
      timersRef.current.set(toast.id, { auto, exit: undefined! });
    });
  }, [toasts]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => {
        clearTimeout(t.auto);
        clearTimeout(t.exit);
      });
      timersRef.current.clear();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const { title, barClass, titleClass, icon } = config[toast.type];
        const isExiting = exitingIds.has(toast.id);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex rounded-xl bg-white shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl ${isExiting ? 'toast-exit' : 'toast-enter'}`}
            role="alert"
          >
            <div className={`w-1 flex-shrink-0 ${barClass}`} aria-hidden />
            <div className="flex-1 flex gap-3 p-4 min-w-0">
              <span className={titleClass} aria-hidden>
                {icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${titleClass}`}>{title}</p>
                <p className="mt-0.5 text-sm text-gray-600">{toast.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startExit(toast.id)}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
