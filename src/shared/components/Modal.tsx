import { useEffect, useState, useRef } from 'react';
import { useUIStore } from '../../stores/ui.store';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const TRANSITION_MS = 200;

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
}: ModalProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const prevOpenRef = useRef(false);

  const show = isOpen || isExiting;

  useEffect(() => {
    if (isOpen) {
      setIsExiting(false);
      requestAnimationFrame(() => setIsVisible(true));
    } else if (prevOpenRef.current) {
      setIsVisible(false);
      setIsExiting(true);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isExiting) return;
    const t = setTimeout(() => setIsExiting(false), TRANSITION_MS);
    return () => clearTimeout(t);
  }, [isExiting]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const exiting = isExiting;
  const entering = show && !isVisible && !exiting;
  const backdropClass = `fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
    exiting || entering ? 'opacity-0' : 'opacity-100'
  }`;
  const panelClass = `relative w-full ${sizeClasses[size]} ${className} ${
    isDarkMode ? 'bg-gray-800' : 'bg-white'
  } rounded-xl shadow-2xl transition-all duration-200 ease-out ${
    exiting ? 'opacity-0 scale-[0.98]' : entering ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
  }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        className={backdropClass}
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Content */}
      <div
        className={panelClass}
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between gap-4 px-6 py-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h2 className={`text-lg font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[min(70vh,500px)] overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
