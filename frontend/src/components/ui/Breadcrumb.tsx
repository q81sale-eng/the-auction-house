import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-obsidian-950 border-b border-obsidian-800/60 px-4">
      <div className="max-w-7xl mx-auto h-11 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-obsidian-500 hover:text-gold-500 transition-colors shrink-0 me-2"
          aria-label="Back"
        >
          <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <svg className="w-3 h-3 text-obsidian-700 flex-shrink-0 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {item.href ? (
              <Link to={item.href} className="text-obsidian-500 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors truncate">
                {item.label}
              </Link>
            ) : (
              <span className="text-obsidian-300 text-xs uppercase tracking-wider truncate">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
