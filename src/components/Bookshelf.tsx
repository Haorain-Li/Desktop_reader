import { useState, useEffect, useMemo } from 'react'
import type { Book, BookFilter } from '@/types'
import { BookCard } from './BookCard'

interface BookshelfProps {
  books: Book[]
  searchQuery: string
  formatFileSize: (bytes: number) => string
  onImport: () => void
  onOpen: (bookId: string) => void
  onRemove: (bookId: string) => void
  onToggleFavorite: (bookId: string) => void
}

const FILTERS: { key: BookFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'reading', label: '在读' },
  { key: 'finished', label: '已读' },
  { key: 'favorite', label: '收藏' },
]

type SortKey = 'addedAt' | 'title' | 'readingProgress' | 'fileSize'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'addedAt', label: '添加时间' },
  { key: 'title', label: '书名' },
  { key: 'readingProgress', label: '阅读进度' },
  { key: 'fileSize', label: '文件大小' },
]

export function Bookshelf({ books, searchQuery, formatFileSize, onImport, onOpen, onRemove, onToggleFavorite }: BookshelfProps) {
  const [filter, setFilter] = useState<BookFilter>('all')
  const [sortBy, setSortBy] = useState<SortKey>('addedAt')
  const [sortAsc, setSortAsc] = useState(false)

  const filteredBooks = useMemo(() => {
    let result = books
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((b) => b.title.toLowerCase().includes(q))
    }
    switch (filter) {
      case 'unread': return result.filter((b) => b.readingProgress === 0 && b.totalReadingTime === 0)
      case 'reading': return result.filter((b) => b.readingProgress > 0 && b.readingProgress < 100)
      case 'finished': return result.filter((b) => b.readingProgress >= 100)
      case 'favorite': return result.filter((b) => b.favorite)
      default: return result
    }
  }, [books, filter, searchQuery])

  const sortedBooks = useMemo(() => {
    const sorted = [...filteredBooks].sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'title': cmp = a.title.localeCompare(b.title, 'zh-CN'); break
        case 'readingProgress': cmp = a.readingProgress - b.readingProgress; break
        case 'fileSize': cmp = a.fileSize - b.fileSize; break
        case 'addedAt': default: cmp = a.addedAt - b.addedAt; break
      }
      return sortAsc ? cmp : -cmp
    })
    return sorted
  }, [filteredBooks, sortBy, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortBy(key)
      setSortAsc(false)
    }
  }

  const recentBooks = useMemo(() => {
    return [...books]
      .filter((b) => b.lastReadAt)
      .sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0))
      .slice(0, 5)
  }, [books])

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                filter === f.key
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg px-1 py-0.5">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSort(s.key)}
                className={`px-2.5 py-1 rounded-md text-[12px] font-semibold transition-all ${
                  sortBy === s.key
                    ? 'bg-white dark:bg-zinc-600 text-zinc-800 dark:text-zinc-200 shadow-sm'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
                title={sortAsc ? '升序' : '降序'}
              >
                {s.label}
                {sortBy === s.key && (
                  <span className="ml-0.5">{sortAsc ? '↑' : '↓'}</span>
                )}
              </button>
            ))}
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{sortedBooks.length} 本</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-6">
        {sortedBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">
              {searchQuery ? '没有找到匹配的书籍' : filter === 'all' ? '还没有书籍' : '该分类暂无书籍'}
            </p>
            {filter === 'all' && !searchQuery && (
              <button onClick={onImport}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-[13px] font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.97] transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                导入书籍
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {sortedBooks.map((book) => (
                <BookCard key={book.id} book={book} formatFileSize={formatFileSize}
                  onOpen={onOpen} onRemove={onRemove} onToggleFavorite={onToggleFavorite} />
              ))}
              {filter === 'all' && !searchQuery && (
                <div onClick={onImport}
                  className="flex flex-col items-center justify-center aspect-[3/4] rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-700 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-600 flex items-center justify-center transition-colors mb-2">
                    <svg className="w-5 h-5 text-zinc-300 dark:text-zinc-500 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors font-bold">添加书籍</span>
                </div>
              )}
            </div>

            {filter === 'all' && !searchQuery && recentBooks.length > 0 && (
              <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">最近阅读</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recentBooks.map((book) => (
                    <div key={book.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600 hover:shadow-sm cursor-pointer transition-all"
                      onClick={() => onOpen(book.id)}>
                      <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-700">
                        <CoverThumb coverPath={book.coverPath} coverColor={book.coverColor} title={book.title} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          {book.favorite && (
                            <svg className="w-3 h-3 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          )}
                          <p className="text-[13px] font-bold text-[#1a1a1a] dark:text-zinc-200 truncate leading-tight">{book.title}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full transition-all" style={{ width: `${book.readingProgress}%` }} />
                          </div>
                          <span className="text-[11px] text-[#999999] dark:text-zinc-500 font-medium shrink-0">{book.readingProgress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CoverThumb({ coverPath, coverColor, title }: { coverPath?: string; coverColor: string; title: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (coverPath) {
      window.electronAPI.cover.read(coverPath).then((r) => {
        if (r.success && r.dataUrl) setSrc(r.dataUrl)
      })
    }
  }, [coverPath])

  if (src) {
    return <img src={src} alt={title} className="w-full h-full object-cover" draggable={false} />
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${coverColor}dd, ${coverColor}aa)` }}>
      <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    </div>
  )
}
