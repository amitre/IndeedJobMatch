'use client';

type SortKey = 'score' | 'date';

interface Props {
  sort: SortKey;
  onSort: (key: SortKey) => void;
  remoteOnly: boolean;
  onRemoteOnly: (v: boolean) => void;
  count: number;
  total: number;
  provider: string;
  onRefresh: () => void;
  refreshing: boolean;
}

export function JobFilters({ sort, onSort, remoteOnly, onRemoteOnly, count, total, provider, onRefresh, refreshing }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-gray-200">
      <div className="flex-1">
        <p className="text-sm text-gray-600">
          Showing <strong>{count}</strong> of {total} jobs
          <span className="text-gray-400 ml-2">via {provider}</span>
        </p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={remoteOnly}
          onChange={(e) => onRemoteOnly(e.target.checked)}
          className="rounded text-blue-600"
        />
        <span className="text-sm text-gray-700">Remote only</span>
      </label>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Sort:</span>
        {(['score', 'date'] as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => onSort(key)}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              sort === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {key === 'score' ? 'Best match' : 'Newest'}
          </button>
        ))}
      </div>

      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        {refreshing ? 'Refreshing…' : '↻ Refine search'}
      </button>
    </div>
  );
}
