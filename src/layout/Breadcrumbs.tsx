import { Link } from 'react-router-dom';
import { useUIStore } from '../stores/ui.store';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
    const isDarkMode = useUIStore((state) => state.isDarkMode);

    if (items.length === 0) return null;

    const linkClass = isDarkMode
        ? 'text-blue-400 hover:text-blue-300 transition-colors'
        : 'text-blue-600 hover:text-blue-700 transition-colors';
    const currentClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const separatorClass = isDarkMode ? 'text-gray-500' : 'text-gray-400';

    return (
        <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
            <ol className="flex flex-wrap items-center gap-1.5">
                {items.map((item, index) => (
                    <li key={index} className="flex items-center gap-1.5">
                        {index > 0 && (
                            <span className={separatorClass} aria-hidden>
                                /
                            </span>
                        )}
                        {item.href ? (
                            <Link to={item.href} className={linkClass}>
                                {item.label}
                            </Link>
                        ) : (
                            <span className={currentClass}>{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
