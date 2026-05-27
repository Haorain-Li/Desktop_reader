import { useState, useEffect, useCallback, useRef } from 'react'
import type { Book } from '@/types'
import { ReaderToolbar } from './ReaderToolbar'

const PAGE_SIZE = 8000 // characters per page

interface TxtReaderProps {
  book: Book
  onClose: () => void
  elapsed: number
  onProgressUpdate: (progress: number, progressData?: string) => void
  theme?: 'light' | 'dark'
  toggleTheme?: () => void
  onAddBookmark?: (label: string, cfi?: string, page?: number) => void
  onRemoveBookmark?: (bookmarkId: string) => void
}

export function TxtReader({ book, onClose, elapsed, onProgressUpdate, theme, toggleTheme, onAddBookmark }: TxtReaderProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState(18)
  const [currentPage, setCurrentPage] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      const result = await window.electronAPI.file.readText(book.filePath)
      if (cancelled) return
      if (result.success && result.content) {
        setContent(result.content)
        if (book.progressData) {
          const savedPage = parseInt(book.progressData, 10) || 0
          setCurrentPage(savedPage)
        }
      }
      else setError(result.error || '无法读取文件')
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [book.filePath])

  const pages = splitIntoPages(content, PAGE_SIZE)
  const totalPages = pages.length

  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(0, Math.min(page, totalPages - 1))
    setCurrentPage(clamped)
    const progress = totalPages > 1 ? Math.round((clamped / (totalPages - 1)) * 100) : 100
    onProgressUpdate(progress, String(clamped))
  }, [totalPages, onProgressUpdate])

  const goNext = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])
  const goPrev = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault(); goPrev()
      } else if (e.key === 'Home') {
        e.preventDefault(); goToPage(0)
      } else if (e.key === 'End') {
        e.preventDefault(); goToPage(totalPages - 1)
      } else if (e.key === 'Escape') {
        e.preventDefault(); onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, goToPage, totalPages, onClose])

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
  }, [currentPage])

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900">
      <ReaderToolbar title={book.title} onClose={onClose} elapsed={elapsed} theme={theme} toggleTheme={toggleTheme}>
        <div className="flex items-center gap-1.5">
          {onAddBookmark && (
            <button onClick={() => onAddBookmark(`第 ${currentPage + 1} 页`, undefined, currentPage)}
              className="px-3.5 py-1.5 text-[13px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors font-bold"
              title="添加书签">书签</button>
          )}
          <button onClick={goPrev} disabled={currentPage <= 0}
            className="px-3 py-1.5 text-[13px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold">
            上一页
          </button>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg px-2.5 py-1.5">
            <span className="text-[13px] text-zinc-500 dark:text-zinc-400 font-bold">{currentPage + 1}</span>
            <span className="text-[13px] text-zinc-400 dark:text-zinc-500 font-bold">/ {totalPages || '--'}</span>
          </div>
          <button onClick={goNext} disabled={currentPage >= totalPages - 1}
            className="px-3 py-1.5 text-[13px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold">
            下一页
          </button>
        </div>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-600" />
        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
          <button onClick={() => setFontSize((s) => Math.max(14, s - 2))}
            className="px-3 py-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-bold transition-colors">A-</button>
          <span className="text-[13px] text-zinc-400 dark:text-zinc-500 w-7 text-center font-bold">{fontSize}</span>
          <button onClick={() => setFontSize((s) => Math.min(32, s + 2))}
            className="px-3 py-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-bold transition-colors">A+</button>
        </div>
      </ReaderToolbar>

      <div ref={contentRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <div
            className="max-w-2xl mx-auto py-20 px-12"
            style={{ fontSize: `${fontSize}px`, lineHeight: 2.2, color: theme === 'dark' ? '#e4e4e7' : '#1a1a1a', fontFamily: "'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', serif" }}
          >
            {(pages[currentPage] || '').split('\n').map((paragraph, i) => (
              <p key={`${currentPage}-${i}`} className="mb-6" style={{ textIndent: `${fontSize * 2}px` }}>
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function splitIntoPages(text: string, pageSize: number): string[] {
  if (!text) return ['']
  const pages: string[] = []
  let start = 0

  while (start < text.length) {
    if (start + pageSize >= text.length) {
      pages.push(text.slice(start))
      break
    }

    let end = start + pageSize
    const newlineIdx = text.lastIndexOf('\n', end)
    if (newlineIdx > start + pageSize * 0.5) {
      end = newlineIdx + 1
    }

    pages.push(text.slice(start, end))
    start = end
  }

  return pages.length > 0 ? pages : ['']
}
