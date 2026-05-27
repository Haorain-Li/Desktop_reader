import { useState, useEffect } from 'react'
import type { Book } from '@/types'
import { ConfirmModal } from './ConfirmModal'

interface BookCardProps {
  book: Book
  formatFileSize: (bytes: number) => string
  onOpen: (bookId: string) => void
  onRemove: (bookId: string) => void
  onToggleFavorite: (bookId: string) => void
}

function formatReadingTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return '未阅读'
  if (minutes < 60) return `已读 ${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  return `已读 ${hours} 小时${minutes % 60 > 0 ? ' ' + (minutes % 60) + ' 分钟' : ''}`
}

function getExtLabel(ext: string): string {
  const map: Record<string, string> = { txt: 'TXT', epub: 'EPUB', pdf: 'PDF' }
  return map[ext] || ext.toUpperCase()
}

export function BookCard({ book, formatFileSize, onOpen, onRemove, onToggleFavorite }: BookCardProps) {
  const [coverSrc, setCoverSrc] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (book.coverPath) {
      window.electronAPI.cover.read(book.coverPath).then((result) => {
        if (result.success && result.dataUrl) setCoverSrc(result.dataUrl)
      })
    }
  }, [book.coverPath])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowConfirm(true)
  }

  return (
    <>
      <div
        className="group flex flex-col cursor-pointer"
        onClick={() => onOpen(book.id)}
        onContextMenu={handleContextMenu}
      >
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm group-hover:shadow-xl group-hover:shadow-zinc-300/50 dark:group-hover:shadow-zinc-900/50 transition-all duration-300 group-hover:-translate-y-1">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={book.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center p-5 text-white relative"
              style={{ background: `linear-gradient(160deg, ${book.coverColor}dd, ${book.coverColor}aa)` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold leading-snug line-clamp-2 text-center drop-shadow-sm px-1">
                {book.title}
              </p>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] text-white/60">
                <span className="bg-white/15 px-2 py-0.5 rounded-md font-bold tracking-wider">
                  {getExtLabel(book.fileExt)}
                </span>
                <span className="font-medium">{formatFileSize(book.fileSize)}</span>
              </div>
            </div>
          )}

          {book.readingProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div className="h-full bg-white/80 transition-all" style={{ width: `${book.readingProgress}%` }} />
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200">
            <div className={`absolute top-2 right-2 z-10 transition-opacity ${book.favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(book.id) }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  book.favorite
                    ? 'bg-amber-400 text-white shadow-md shadow-amber-400/30 hover:bg-amber-500 hover:scale-110'
                    : 'bg-white/90 text-zinc-400 hover:text-amber-500 hover:scale-110'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={book.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                <div className="bg-white/95 backdrop-blur-sm rounded-full px-5 py-2 text-[13px] font-bold text-zinc-800 shadow-lg shadow-black/10 pointer-events-none">
                  打开阅读
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 px-0.5">
          <div className="flex items-center gap-1.5">
            {book.favorite && (
              <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            )}
            <h3 className="text-base font-bold text-[#1a1a1a] dark:text-zinc-200 truncate leading-tight" title={book.title}>
              {book.title}
            </h3>
          </div>
          <p className="text-[14px] text-[#666666] dark:text-zinc-400 mt-0.5">
            {getExtLabel(book.fileExt)} · {formatFileSize(book.fileSize)}
          </p>
          <p className="text-xs text-[#999999] dark:text-zinc-500 mt-0.5">
            {formatReadingTime(book.totalReadingTime)}
          </p>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="移除书籍"
        message={`确定要移除《${book.title}》吗？此操作不会删除原始文件。`}
        confirmText="移除"
        variant="danger"
        onConfirm={() => { setShowConfirm(false); onRemove(book.id) }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
