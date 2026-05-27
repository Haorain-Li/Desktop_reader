import { useState, useEffect, useCallback } from 'react'
import type { Book } from '@/types'
import { TxtReader } from './TxtReader'
import { EpubReader } from './EpubReader'
import { PdfReader } from './PdfReader'

interface ReaderViewProps {
  book: Book
  onClose: () => void
  onProgressUpdate: (bookId: string, progress: number, progressData?: string) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
  addBookmark: (bookId: string, label: string, cfi?: string, page?: number) => void
  removeBookmark: (bookId: string, bookmarkId: string) => void
}

export function ReaderView({ book, onClose, onProgressUpdate, theme, toggleTheme, addBookmark, removeBookmark }: ReaderViewProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleProgressUpdate = useCallback(
    (progress: number, progressData?: string) => {
      onProgressUpdate(book.id, progress, progressData)
    },
    [book.id, onProgressUpdate]
  )

  const handleAddBookmark = useCallback(
    (label: string, cfi?: string, page?: number) => {
      addBookmark(book.id, label, cfi, page)
    },
    [book.id, addBookmark]
  )

  const handleRemoveBookmark = useCallback(
    (bookmarkId: string) => {
      removeBookmark(book.id, bookmarkId)
    },
    [book.id, removeBookmark]
  )

  if (book.fileExt === 'epub') {
    return <EpubReader key={book.id} book={book} onClose={onClose} elapsed={elapsed} onProgressUpdate={handleProgressUpdate} theme={theme} toggleTheme={toggleTheme} onAddBookmark={handleAddBookmark} onRemoveBookmark={handleRemoveBookmark} />
  }

  if (book.fileExt === 'pdf') {
    return <PdfReader key={book.id} book={book} onClose={onClose} elapsed={elapsed} onProgressUpdate={handleProgressUpdate} theme={theme} toggleTheme={toggleTheme} onAddBookmark={handleAddBookmark} onRemoveBookmark={handleRemoveBookmark} />
  }

  return <TxtReader key={book.id} book={book} onClose={onClose} elapsed={elapsed} onProgressUpdate={handleProgressUpdate} theme={theme} toggleTheme={toggleTheme} onAddBookmark={handleAddBookmark} onRemoveBookmark={handleRemoveBookmark} />
}
