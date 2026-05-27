import { useState, useCallback, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import type { Book } from '@/types'
import { ReaderToolbar } from './ReaderToolbar'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

interface PdfReaderProps {
  book: Book
  onClose: () => void
  elapsed: number
  onProgressUpdate: (progress: number, progressData?: string) => void
  theme?: 'light' | 'dark'
  toggleTheme?: () => void
  onAddBookmark?: (label: string, cfi?: string, page?: number) => void
  onRemoveBookmark?: (bookmarkId: string) => void
}

export function PdfReader({ book, onClose, elapsed, onProgressUpdate, theme, toggleTheme, onAddBookmark }: PdfReaderProps) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(() => book.progressData ? parseInt(book.progressData, 10) || 1 : 1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null)
  const [scale, setScale] = useState(1.3)

  const currentPageRef = useRef(currentPage)
  const numPagesRef = useRef(numPages)
  currentPageRef.current = currentPage
  numPagesRef.current = numPages

  useEffect(() => {
    let cancelled = false
    async function loadPdf() {
      setLoading(true); setError(null)
      const result = await window.electronAPI.file.readBuffer(book.filePath)
      if (cancelled) return
      if (result.success && result.buffer) setPdfData(result.buffer)
      else { setError(result.error || '无法读取文件'); setLoading(false) }
    }
    loadPdf()
    return () => { cancelled = true }
  }, [book.filePath])

  const onDocumentLoadSuccess = useCallback(({ numPages: total }: { numPages: number }) => {
    setNumPages(total); setLoading(false)
    onProgressUpdate(Math.round((Math.min(currentPage, total) / total) * 100), String(currentPage))
  }, [currentPage, onProgressUpdate])

  const onDocumentLoadError = useCallback((err: Error) => {
    setError('PDF 加载失败: ' + err.message); setLoading(false)
  }, [])

  const goToPage = useCallback((page: number) => {
    const total = numPagesRef.current
    if (page < 1 || page > total) return
    setCurrentPage(page)
    onProgressUpdate(Math.round((page / total) * 100), String(page))
  }, [onProgressUpdate])

  const goToPageRef = useRef(goToPage)
  goToPageRef.current = goToPage

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const cur = currentPageRef.current
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPageRef.current(cur - 1)
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        goToPageRef.current(cur + 1)
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-900">
      <ReaderToolbar title={book.title} onClose={onClose} elapsed={elapsed} theme={theme} toggleTheme={toggleTheme}>
        <div className="flex items-center gap-1.5">
          {onAddBookmark && (
            <button onClick={() => onAddBookmark(`第 ${currentPage} 页`, undefined, currentPage)}
              className="px-3.5 py-1.5 text-[13px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors font-bold"
              title="添加书签">书签</button>
          )}
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}
            className="px-3 py-1.5 text-[13px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold">
            上一页
          </button>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg px-2.5 py-1.5">
            <input type="number" min={1} max={numPages || 1} value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value, 10) || 1)}
              className="w-10 text-[13px] text-center text-zinc-700 dark:text-zinc-300 bg-transparent outline-none font-bold" />
            <span className="text-[13px] text-zinc-400 dark:text-zinc-500 font-bold">/ {numPages || '--'}</span>
          </div>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= numPages}
            className="px-3 py-1.5 text-[13px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold">
            下一页
          </button>
        </div>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-600" />
        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
          <button onClick={() => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)))} className="px-3 py-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-bold transition-colors">-</button>
          <span className="text-[13px] text-zinc-400 dark:text-zinc-500 w-10 text-center font-bold">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1)))} className="px-3 py-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-bold transition-colors">+</button>
        </div>
      </ReaderToolbar>

      <div className="flex-1 overflow-auto flex justify-center py-8">
        {loading && <div className="flex items-center justify-center h-full w-full"><div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" /></div>}
        {error && (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{error}</p>
            </div>
          </div>
        )}
        {pdfData && (
          <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} loading={null}>
            <Page pageNumber={currentPage} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} />
          </Document>
        )}
      </div>
    </div>
  )
}
