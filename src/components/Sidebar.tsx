import { useState } from 'react'
import type { ViewMode } from '@/types'

interface SidebarProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  bookCount: number
  totalReadingTime: number
  theme?: 'light' | 'dark'
  toggleTheme?: () => void
}

function formatTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  if (totalMinutes < 60) return `${totalMinutes} 分钟`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours < 24) return `${hours} 小时${minutes > 0 ? ' ' + minutes + ' 分' : ''}`
  const days = Math.floor(hours / 24)
  return `${days} 天${hours % 24 > 0 ? ' ' + (hours % 24) + ' 小时' : ''}`
}

export function Sidebar({ currentView, onViewChange, bookCount, totalReadingTime, theme, toggleTheme }: SidebarProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="flex flex-col bg-zinc-50/80 dark:bg-zinc-800/80 border-r border-zinc-200/60 dark:border-zinc-700/60 shrink-0 transition-all duration-300 ease-in-out"
      style={{ width: expanded ? '240px' : '72px' }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <nav className="flex-1 py-5 px-3 space-y-2">
        <button
          onClick={() => onViewChange('bookshelf')}
          className={`w-full flex items-center gap-3.5 rounded-xl transition-all duration-200 ${
            expanded ? 'px-4 py-3.5' : 'px-0 py-3.5 justify-center'
          } ${
            currentView === 'bookshelf'
              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-700/40'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
          title="书架"
        >
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          {expanded && (
            <>
              <span className="text-base font-semibold whitespace-nowrap">书架</span>
              {bookCount > 0 && (
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-md font-bold ${
                  currentView === 'bookshelf' ? 'bg-amber-200/50 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300/70' : 'bg-zinc-200/80 dark:bg-zinc-600/80 text-zinc-400 dark:text-zinc-500'
                }`}>
                  {bookCount}
                </span>
              )}
            </>
          )}
        </button>

        <button
          onClick={() => onViewChange('stats')}
          className={`w-full flex items-center gap-3.5 rounded-xl transition-all duration-200 ${
            expanded ? 'px-4 py-3.5' : 'px-0 py-3.5 justify-center'
          } ${
            currentView === 'stats'
              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-700/40'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
          title="统计"
        >
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
          {expanded && <span className="text-base font-semibold whitespace-nowrap">统计</span>}
        </button>

        <button
          onClick={() => onViewChange('sync')}
          className={`w-full flex items-center gap-3.5 rounded-xl transition-all duration-200 ${
            expanded ? 'px-4 py-3.5' : 'px-0 py-3.5 justify-center'
          } ${
            currentView === 'sync'
              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-700/40'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
          title="同步"
        >
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L 1 14" />
          </svg>
          {expanded && <span className="text-base font-semibold whitespace-nowrap">同步</span>}
        </button>

        {toggleTheme && (
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3.5 rounded-xl transition-all duration-200 ${
              expanded ? 'px-4 py-3.5' : 'px-0 py-3.5 justify-center'
            } text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 hover:text-zinc-800 dark:hover:text-zinc-200`}
            title={theme === 'dark' ? '切换浅色' : '切换深色'}
          >
            {theme === 'dark' ? (
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
            {expanded && <span className="text-base font-semibold whitespace-nowrap">{theme === 'dark' ? '浅色模式' : '深色模式'}</span>}
          </button>
        )}
      </nav>

      <div className={`px-3 pb-5 ${expanded ? '' : 'px-2 pb-4'}`}>
        {expanded ? (
          <div className="px-4 py-4 bg-white dark:bg-zinc-700 rounded-xl border border-zinc-100 dark:border-zinc-600">
            <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">累计阅读</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
              {formatTime(totalReadingTime)}
            </div>
          </div>
        ) : (
          <div className="text-center py-1">
            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-tight">{formatTime(totalReadingTime)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
