import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Book, ReadingSession, AppData } from '@/types'
import { extractEpubCover, extractPdfCover } from '@/utils/coverExtractor'

const COVER_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#34495e', '#e84393', '#00b894',
  '#6c5ce7', '#fd79a8', '#fdcb6e', '#00cec9', '#0984e3',
]

function getRandomColor(): string {
  return COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)]
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const DEFAULT_DATA: AppData = {
  books: [],
  readingSessions: [],
  totalReadingTime: 0,
}

export function useReaderStore() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA)
  const [activeBookId, setActiveBookId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dataRef = useRef<AppData>(data)
  const pendingRef = useRef(false)

  // Keep dataRef in sync with state
  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const saved = await window.electronAPI.store.get()
      if (saved) {
        const merged = { ...DEFAULT_DATA, ...saved }
        setData(merged)
        dataRef.current = merged
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoaded(true)
    }
  }

  const writeToDisk = useCallback((newData: AppData) => {
    window.electronAPI.store.set(newData)
  }, [])

  const debouncedSave = useCallback(() => {
    pendingRef.current = true
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      pendingRef.current = false
      writeToDisk(dataRef.current)
    }, 3000)
  }, [writeToDisk])

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (pendingRef.current) {
      pendingRef.current = false
      writeToDisk(dataRef.current)
    }
  }, [writeToDisk])

  const updateBookProgress = useCallback(
    (bookId: string, progress: number, progressData?: string) => {
      setData((prev) => {
        const book = prev.books.find((b) => b.id === bookId)
        if (book && book.readingProgress === progress && book.progressData === progressData) return prev
        const newData = {
          ...prev,
          books: prev.books.map((b) =>
            b.id === bookId
              ? { ...b, readingProgress: progress, progressData, lastReadAt: Date.now() }
              : b
          ),
        }
        dataRef.current = newData
        debouncedSave()
        return newData
      })
    },
    [debouncedSave]
  )

  const importBooks = useCallback(async () => {
    const files = await window.electronAPI.dialog.openFile()
    if (!files || files.length === 0) return
    await addBooks(files)
  }, [])

  const importBooksByPaths = useCallback(async (filePaths: string[]) => {
    const files = await window.electronAPI.dialog.resolveFiles(filePaths)
    if (!files || files.length === 0) return
    await addBooks(files)
  }, [])

  const addBooks = useCallback(async (files: Array<{ filePath: string; fileName: string; fileSize: number; fileExt: string }>) => {
    let newBooks: Book[] = []

    setData((prev) => {
      const existingPaths = new Set(prev.books.map((b) => b.filePath))
      newBooks = files
        .filter((f) => !existingPaths.has(f.filePath))
        .map((f) => ({
          id: uuidv4(),
          title: f.fileName,
          filePath: f.filePath,
          fileSize: f.fileSize,
          fileExt: f.fileExt,
          coverColor: getRandomColor(),
          addedAt: Date.now(),
          readingProgress: 0,
          totalReadingTime: 0,
        }))

      if (newBooks.length === 0) return prev
      const newData = { ...prev, books: [...prev.books, ...newBooks] }
      dataRef.current = newData
      writeToDisk(newData)
      return newData
    })

    // Extract covers in parallel, non-blocking
    if (newBooks.length > 0) {
      Promise.allSettled(
        newBooks.map(async (book) => {
          try {
            let dataUrl: string | null = null
            if (book.fileExt === 'epub') {
              dataUrl = await extractEpubCover(book.filePath)
            } else if (book.fileExt === 'pdf') {
              dataUrl = await extractPdfCover(book.filePath)
            }
            if (dataUrl) {
              const res = await window.electronAPI.cover.save(book.id, dataUrl)
              if (res.success && res.coverPath) {
                setData((prev) => {
                  const newData = {
                    ...prev,
                    books: prev.books.map((b) =>
                      b.id === book.id ? { ...b, coverPath: res.coverPath } : b
                    ),
                  }
                  dataRef.current = newData
                  writeToDisk(newData)
                  return newData
                })
              }
            }
          } catch {
            // fallback to coverColor
          }
        })
      )
    }
  }, [writeToDisk])

  const toggleFavorite = useCallback(async (bookId: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        books: prev.books.map((b) =>
          b.id === bookId ? { ...b, favorite: !b.favorite } : b
        ),
      }
      dataRef.current = newData
      writeToDisk(newData)
      return newData
    })
  }, [writeToDisk])

  const removeBook = useCallback(async (bookId: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        books: prev.books.filter((b) => b.id !== bookId),
        readingSessions: prev.readingSessions.filter((s) => s.bookId !== bookId),
      }
      dataRef.current = newData
      writeToDisk(newData)
      return newData
    })
  }, [writeToDisk])

  const openBook = useCallback(async (bookId: string) => {
    // Validate file exists before opening
    const book = dataRef.current.books.find((b) => b.id === bookId)
    if (book) {
      const info = await window.electronAPI.file.getInfo(book.filePath)
      if (!info.exists) {
        alert('文件不存在，可能已被移动或删除')
        return
      }
    }

    setActiveBookId(bookId)
    setSessionStartTime(Date.now())
    setData((prev) => ({
      ...prev,
      books: prev.books.map((b) =>
        b.id === bookId ? { ...b, lastReadAt: Date.now() } : b
      ),
    }))
  }, [])

  const closeBook = useCallback(async () => {
    flushSave()
    if (activeBookId && sessionStartTime) {
      const duration = Date.now() - sessionStartTime
      const session: ReadingSession = {
        bookId: activeBookId,
        startTime: sessionStartTime,
        endTime: Date.now(),
        duration,
      }

      setData((prev) => {
        const newData = {
          ...prev,
          books: prev.books.map((b) =>
            b.id === activeBookId
              ? { ...b, totalReadingTime: b.totalReadingTime + duration }
              : b
          ),
          readingSessions: [...prev.readingSessions, session],
          totalReadingTime: prev.totalReadingTime + duration,
        }
        dataRef.current = newData
        writeToDisk(newData)
        return newData
      })
    }
    setActiveBookId(null)
    setSessionStartTime(null)
  }, [activeBookId, sessionStartTime, flushSave, writeToDisk])

  // Save on beforeunload (crash/force-quit protection)
  useEffect(() => {
    const handler = () => {
      if (pendingRef.current) {
        window.electronAPI.store.setSync(dataRef.current)
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const addBookmark = useCallback((bookId: string, label: string, cfi?: string, page?: number) => {
    setData((prev) => {
      const newData = {
        ...prev,
        books: prev.books.map((b) =>
          b.id === bookId
            ? { ...b, bookmarks: [...(b.bookmarks || []), { id: uuidv4(), label, cfi, page, createdAt: Date.now() }] }
            : b
        ),
      }
      dataRef.current = newData
      writeToDisk(newData)
      return newData
    })
  }, [writeToDisk])

  const removeBookmark = useCallback((bookId: string, bookmarkId: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        books: prev.books.map((b) =>
          b.id === bookId
            ? { ...b, bookmarks: (b.bookmarks || []).filter((bm) => bm.id !== bookmarkId) }
            : b
        ),
      }
      dataRef.current = newData
      writeToDisk(newData)
      return newData
    })
  }, [writeToDisk])

  const activeBook = dataRef.current.books.find((b) => b.id === activeBookId) || null

  return {
    data,
    loaded,
    activeBook,
    openBook,
    closeBook,
    importBooks,
    importBooksByPaths,
    reloadData: loadData,
    removeBook,
    toggleFavorite,
    updateBookProgress,
    formatFileSize,
    addBookmark,
    removeBookmark,
  }
}
