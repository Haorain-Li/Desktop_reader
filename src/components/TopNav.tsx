interface TopNavProps {
  onImport: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function TopNav({ onImport, searchQuery, onSearchChange }: TopNavProps) {
  const handleMinimize = () => window.electronAPI.window.minimize()
  const handleMaximize = () => window.electronAPI.window.maximize()
  const handleClose = () => window.electronAPI.window.close()

  return (
    <div className="drag-region relative h-14 flex items-center justify-between px-5 bg-white dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700 shrink-0">
      {/* Left: Logo */}
      <div className="flex items-center gap-3 no-drag shrink-0 z-10">
        <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-white dark:text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <span className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">阅读器</span>
      </div>

      {/* Center: Search */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 no-drag z-10">
        <div className="relative w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索书籍..."
            className="w-full h-9 px-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm text-center text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-600 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500 flex items-center justify-center transition-colors"
            >
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12">
                <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="2" />
                <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0 no-drag z-10">
        <button
          onClick={onImport}
          className="h-9 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.97] transition-all inline-flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>导入书籍</span>
        </button>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-600 mx-1" />

        <button onClick={handleMinimize} className="w-9 h-9 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors" title="最小化">
          <svg className="w-3.5 h-3.5" viewBox="0 0 12 12"><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
        <button onClick={handleMaximize} className="w-9 h-9 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors" title="最大化">
          <svg className="w-3.5 h-3.5" viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
        </button>
        <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="关闭">
          <svg className="w-3.5 h-3.5" viewBox="0 0 12 12"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" /><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
      </div>
    </div>
  )
}
