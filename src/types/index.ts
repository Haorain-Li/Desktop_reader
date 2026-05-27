export interface Bookmark {
  id: string
  label: string
  cfi?: string      // EPUB location
  page?: number     // PDF/TXT page
  createdAt: number
}

export interface Book {
  id: string
  title: string
  filePath: string
  fileSize: number
  fileExt: string
  coverColor: string
  coverPath?: string
  favorite?: boolean
  bookmarks?: Bookmark[]
  addedAt: number
  lastReadAt?: number
  readingProgress: number
  progressData?: string
  totalReadingTime: number
}

export type BookFilter = 'all' | 'unread' | 'reading' | 'finished' | 'favorite'

export interface ReadingSession {
  bookId: string
  startTime: number
  endTime: number
  duration: number
}

export interface AppData {
  books: Book[]
  readingSessions: ReadingSession[]
  totalReadingTime: number
}

export type ViewMode = 'bookshelf' | 'stats' | 'sync'
