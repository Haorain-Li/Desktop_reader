import type { ReactNode } from 'react'

interface ReaderToolbarProps {
  title: string
  onClose: () => void
  elapsed: number
  theme?: 'light' | 'dark'
  toggleTheme?: () => void
  children?: ReactNode
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ReaderToolbar({ title, onClose, elapsed, theme, toggleTheme, children }: ReaderToolbarProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700 shrink-0 drag-region">
      <div className="flex items-center gap-3 no-drag">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors font-semibold"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-600" />
        <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-sm">{title}</span>
      </div>

      <div className="flex items-center gap-2 no-drag">
        {children}

        {toggleTheme && (
          <button onClick={toggleTheme} className="px-2.5 py-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors" title="切换主题">
            {theme === 'dark' ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
        )}

        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-lg px-2.5 py-1.5">
          <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono w-12 text-center font-semibold">
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>
    </div>
  )
}
