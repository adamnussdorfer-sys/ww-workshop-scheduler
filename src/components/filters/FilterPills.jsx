import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function FilterPills() {
  const { filters, setFilters, coaches } = useApp();

  const coachMap = new Map(coaches.map((c) => [c.id, c]));

  const pills = [
    ...filters.coaches.map((id) => ({
      key: `coach-${id}`,
      label: `Coach: ${coachMap.get(id)?.name ?? id}`,
      remove: () =>
        setFilters((prev) => ({
          ...prev,
          coaches: prev.coaches.filter((v) => v !== id),
        })),
    })),
    ...filters.types.map((value) => ({
      key: `type-${value}`,
      label: `Type: ${value}`,
      remove: () =>
        setFilters((prev) => ({
          ...prev,
          types: prev.types.filter((v) => v !== value),
        })),
    })),
    ...filters.statuses.map((value) => ({
      key: `status-${value}`,
      label: `Status: ${value}`,
      remove: () =>
        setFilters((prev) => ({
          ...prev,
          statuses: prev.statuses.filter((v) => v !== value),
        })),
    })),
    ...filters.markets.map((value) => ({
      key: `market-${value}`,
      label: `Market: ${value}`,
      remove: () =>
        setFilters((prev) => ({
          ...prev,
          markets: prev.markets.filter((v) => v !== value),
        })),
    })),
  ];

  if (pills.length === 0) return null;

  const clearAll = () =>
    setFilters({ coaches: [], types: [], statuses: [], markets: [] });

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2">
      {pills.map(({ key, label, remove }) => (
        <span
          key={key}
          className="flex items-center gap-1 px-2 py-1 bg-ww-blue/10 text-ww-blue text-xs font-medium rounded-full"
        >
          {label}
          <button
            type="button"
            onClick={remove}
            aria-label={`Remove filter: ${label}`}
            className="ml-0.5 text-ww-blue/60 hover:text-ww-blue"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs text-slate-500 hover:text-ww-navy underline ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
