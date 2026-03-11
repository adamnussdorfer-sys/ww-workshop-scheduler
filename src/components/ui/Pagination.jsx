import { ChevronLeft, ChevronRight } from 'lucide-react';

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');
  if (!pages.includes(total)) pages.push(total);

  return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-1 py-3 px-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={14} />
        Prev
      </button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[28px] h-7 text-xs font-medium rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-ww-blue text-white'
                : 'text-slate-600 hover:bg-surface-2'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
