import { useState, useRef } from 'react'
import { useReaderStore } from '@/store/useReaderStore'
import { useTheme } from '@/store/useTheme'
import { TopNav } from '@/components/TopNav'
import { Sidebar } from '@/components/Sidebar'
import { Bookshelf } from '@/components/Bookshelf'
import { StatsView } from '@/components/StatsView'
import { SyncView } from '@/components/SyncView'
import { ReaderView } from '@/components/ReaderView'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { ViewMode } from '@/types'

export default function App() {
  const {
    data,
    loaded,
    activeBook,
    openBook,
    closeBook,
    importBooks,
    importBooksByPaths,
    reloadData,
    removeBook,
    toggleFavorite,
    updateBookProgress,
    formatFileSize,
    addBookmark,
    removeBookmark,
  } = useReaderStore()

  const { theme, toggleTheme } = useTheme()
  const [currentView, setCurrentView] = useState<ViewMode>('bookshelf')
  const [searchQuery, setSearchQuery] = useState('')
  const [dragging, setDragging] = useState(false)
  const counterRef = useRef(0)

  if (!loaded) {
    return (
      <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (activeBook) {
    return (
      <div className="h-screen flex flex-col">
        <ErrorBoundary>
          <ReaderView book={activeBook} onClose={closeBook} onProgressUpdate={updateBookProgress} theme={theme} toggleTheme={toggleTheme} addBookmark={addBookmark} removeBookmark={removeBookmark} />
        </ErrorBoundary>
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col relative bg-zinc-50 dark:bg-zinc-900"
      onDragEnter={(e) => {
        e.preventDefault()
        counterRef.current++
        if (e.dataTransfer.types.includes('Files')) setDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        counterRef.current--
        if (counterRef.current <= 0) { counterRef.current = 0; setDragging(false) }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDrop={(e) => {
        e.preventDefault()
        counterRef.current = 0
        setDragging(false)
        const files = Array.from(e.dataTransfer.files)
        const paths = files.map((f) => window.electronAPI.fileUtils.getPathForFile(f)).filter(Boolean)
        if (paths.length > 0) importBooksByPaths(paths)
      }}
    >
      <TopNav
        onImport={importBooks}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          bookCount={data.books.length}
          totalReadingTime={data.totalReadingTime}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <div className="flex-1 overflow-hidden">
          {currentView === 'bookshelf' ? (
            <Bookshelf
              books={data.books}
              searchQuery={searchQuery}
              formatFileSize={formatFileSize}
              onImport={importBooks}
              onOpen={openBook}
              onRemove={removeBook}
              onToggleFavorite={toggleFavorite}
            />
          ) : currentView === 'stats' ? (
            <StatsView
              books={data.books}
              readingSessions={data.readingSessions}
              totalReadingTime={data.totalReadingTime}
            />
          ) : (
            <SyncView books={data.books} reloadData={reloadData} />
          )}
        </div>
      </div>

      {dragging && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-white dark:text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">拖放文件到此处导入</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 font-medium">支持 EPUB、PDF、TXT 格式</p>
        </div>
      )}
    </div>
  )
}
