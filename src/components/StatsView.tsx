import { useMemo } from 'react'
import type { Book, ReadingSession } from '@/types'

interface StatsViewProps {
  books: Book[]
  readingSessions: ReadingSession[]
  totalReadingTime: number
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`
  if (minutes > 0) return `${minutes} 分钟`
  return `${totalSeconds} 秒`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export function StatsView({ books, readingSessions, totalReadingTime }: StatsViewProps) {
  const last7Days = useMemo(() => getLast7Days(), [])

  const dailyStats = useMemo(() => {
    const dayMap = new Map<string, number>()
    readingSessions.forEach((s) => {
      const key = new Date(s.startTime).toISOString().split('T')[0]
      dayMap.set(key, (dayMap.get(key) || 0) + s.duration)
    })
    const values = last7Days.map((d) => dayMap.get(d) || 0)
    const max = Math.max(...values, 1)
    return { values, max }
  }, [readingSessions, last7Days])

  const recentSessions = useMemo(() => {
    return [...readingSessions].sort((a, b) => b.endTime - a.endTime).slice(0, 10)
  }, [readingSessions])

  const booksRead = books.filter((b) => b.totalReadingTime > 0).length
  const avgDaily = readingSessions.length > 0
    ? totalReadingTime / Math.max(new Set(readingSessions.map((s) => new Date(s.startTime).toISOString().split('T')[0])).size, 1)
    : 0

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 pt-10 pb-6">
        <h1 className="text-[28px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">统计</h1>
      </div>

      <div className="px-10 pb-10 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="累计阅读" value={formatTime(totalReadingTime)} />
          <StatCard label="已读书籍" value={`${booksRead} 本`} />
          <StatCard label="书架藏书" value={`${books.length} 本`} />
          <StatCard label="日均阅读" value={formatTime(avgDaily)} />
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-7 border border-zinc-100 dark:border-zinc-700">
          <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-6">近 7 天</h2>
          <div className="flex items-end gap-3 h-44">
            {last7Days.map((day, i) => {
              const value = dailyStats.values[i]
              const height = dailyStats.max > 0 ? (value / dailyStats.max) * 100 : 0
              const date = new Date(day)
              const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-[11px] text-zinc-400 dark:text-zinc-500 h-4 font-semibold">
                    {value > 0 ? formatTime(value) : ''}
                  </div>
                  <div className="w-full flex items-end justify-center" style={{ height: '130px' }}>
                    <div
                      className="w-full max-w-[44px] rounded-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(height, 3)}%`,
                        background: value > 0 ? '#18181b' : '#f4f4f5',
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold">周{weekday}</span>
                </div>
              )
            })}
          </div>
        </div>

        {books.filter((b) => b.totalReadingTime > 0).length > 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-7 border border-zinc-100 dark:border-zinc-700">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">阅读排行</h2>
            <div className="space-y-3">
              {[...books]
                .filter((b) => b.totalReadingTime > 0)
                .sort((a, b) => b.totalReadingTime - a.totalReadingTime)
                .map((book, index) => (
                  <div key={book.id} className="flex items-center gap-3.5 py-1">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${
                      index === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                      index === 1 ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400' :
                      index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                      'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: book.coverColor }} />
                    <span className="text-[13px] text-zinc-700 dark:text-zinc-300 truncate flex-1 font-medium">{book.title}</span>
                    <span className="text-[13px] text-zinc-400 dark:text-zinc-500 shrink-0 font-bold">{formatTime(book.totalReadingTime)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {recentSessions.length > 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-7 border border-zinc-100 dark:border-zinc-700">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">阅读记录</h2>
            <div className="space-y-2.5">
              {recentSessions.map((session, i) => {
                const book = books.find((b) => b.id === session.bookId)
                if (!book) return null
                return (
                  <div key={i} className="flex items-center gap-3.5 py-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: book.coverColor }} />
                    <span className="text-[13px] text-zinc-600 dark:text-zinc-400 truncate flex-1 font-medium">{book.title}</span>
                    <span className="text-[13px] text-zinc-400 dark:text-zinc-500 font-semibold">{formatTime(session.duration)}</span>
                    <span className="text-[11px] text-zinc-300 dark:text-zinc-600 font-medium">{formatDate(session.startTime)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700">
      <div className="text-[26px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-none mb-2">{value}</div>
      <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">{label}</div>
    </div>
  )
}
