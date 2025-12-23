'use client'

import { formatHistoryDate } from '@/lib/storage'
import { formatSum } from '@/lib/decrypt'
import type { HistoryItem } from '@/lib/storage'

interface HistoryPanelProps {
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onDelete: (id: string) => void
  onClear: () => void
}

export default function HistoryPanel({
  history,
  onSelect,
  onDelete,
  onClear
}: HistoryPanelProps) {
  if (history.length === 0) return null

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">История</h2>
        <button
          onClick={onClear}
          className="text-sm text-muted hover:text-error transition-colors"
        >
          Очистить всё
        </button>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="card cursor-pointer hover:border-accent/30 transition-all group"
            onClick={() => onSelect(item)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted mb-1">
                  {formatHistoryDate(item.timestamp)}
                </div>
                <div className="truncate">
                  {item.displayName}
                </div>
                <div className="text-accent font-medium">
                  {formatSum(item.displaySum)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item.id)
                }}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/20 transition-all"
                title="Удалить"
              >
                <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
