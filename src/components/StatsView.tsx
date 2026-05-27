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

function formatShortTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  if (totalMinutes < 60) return `${totalMinutes}分`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}时${minutes}分` : `${hours}时`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

function formatWeekday(timestamp: number): string {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return '今天'
  if (date.toDateString() === yesterday.toDateString()) return '昨天'

  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
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
  const uniqueDays = new Set(readingSessions.map((s) => new Date(s.startTime).toISOString().split('T')[0])).size
  const avgDaily = readingSessions.length > 0
    ? totalReadingTime / Math.max(uniqueDays, 1)
    : 0

  const rankedBooks = useMemo(() => {
    return [...books]
      .filter((b) => b.totalReadingTime > 0)
      .sort((a, b) => b.totalReadingTime - a.totalReadingTime)
      .slice(0, 8)
  }, [books])

  const maxRankTime = rankedBooks.length > 0 ? rankedBooks[0].totalReadingTime : 1
  const hasData = readingSessions.length > 0 || books.length > 0

  if (!hasData) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-10 pt-10 pb-6">
          <h1 className="text-[28px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">统计</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-amber-400 dark:text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
          </div>
          <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">还没有阅读数据</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">开始阅读后这里会展示你的阅读统计</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 pt-10 pb-6">
        <h1 className="text-[28px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">统计</h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1.5">你的阅读数据概览</p>
      </div>

      <div className="px-10 pb-10 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="累计阅读"
            value={formatTime(totalReadingTime)}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
          <StatCard
            label="已读书籍"
            value={`${booksRead}`}
            suffix="本"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
          />
          <StatCard
            label="书架藏书"
            value={`${books.length}`}
            suffix="本"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
          <StatCard
            label="日均阅读"
            value={formatTime(avgDaily)}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            }
          />
        </div>

        {/* 7-Day Chart */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-7 border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">近 7 天</h2>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              共 {formatTime(dailyStats.values.reduce((a, b) => a + b, 0))}
            </span>
          </div>
          <div className="relative">
            {/* Gridlines */}
            <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-zinc-100 dark:border-zinc-700/50" />
              ))}
            </div>
            <div className="flex items-end gap-3 h-48 relative z-10">
              {last7Days.map((day, i) => {
                const value = dailyStats.values[i]
                const height = dailyStats.max > 0 ? (value / dailyStats.max) * 100 : 0
                const date = new Date(day)
                const dayNum = date.getDate()
                const weekday = formatWeekday(date.getTime())
                const isToday = new Date().toDateString() === date.toDateString()

                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 h-4 font-medium">
                      {value > 0 ? formatShortTime(value) : ''}
                    </div>
                    <div className="w-full flex items-end justify-center flex-1">
                      <div
                        className={`w-full max-w-[44px] rounded-lg transition-all duration-500 ${isToday ? 'ring-2 ring-amber-300/40 dark:ring-amber-500/30' : ''}`}
                        style={{
                          height: `${Math.max(height, 3)}%`,
                          background: value > 0
                            ? 'linear-gradient(to top, var(--color-accent), var(--color-accent-muted))'
                            : 'var(--color-border)',
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={`text-[11px] font-bold ${isToday ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {weekday}
                      </span>
                      <span className="text-[10px] text-zinc-300 dark:text-zinc-600">{dayNum}日</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Reading Ranking */}
        {rankedBooks.length > 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-7 border border-zinc-100 dark:border-zinc-700">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">阅读排行</h2>
            <div className="space-y-3">
              {rankedBooks.map((book, index) => (
                <div key={book.id} className="flex items-center gap-3.5 group">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0 ${
                    index === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                    index === 1 ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400' :
                    index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                    'bg-zinc-50 dark:bg-zinc-700/50 text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] text-zinc-700 dark:text-zinc-300 truncate font-medium">{book.title}</span>
                      <span className="text-[12px] text-zinc-400 dark:text-zinc-500 shrink-0 font-semibold ml-3">{formatShortTime(book.totalReadingTime)}</span>
                    </div>
                    <div className="h-1 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(book.totalReadingTime / maxRankTime) * 100}%`,
                          background: index === 0
                            ? 'linear-gradient(to right, var(--color-accent), var(--color-accent-muted))'
                            : index === 1
                              ? 'linear-gradient(to right, #a1a1aa, #d4d4d8)'
                              : index === 2
                                ? 'linear-gradient(to right, #f97316, #fb923c)'
                                : 'var(--color-border)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 overflow-hidden">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-7 pt-7 pb-4">阅读记录</h2>
            <div className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
              {recentSessions.map((session, i) => {
                const book = books.find((b) => b.id === session.bookId)
                if (!book) return null
                return (
                  <div key={i} className="flex items-center gap-3.5 px-7 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: book.coverColor }} />
                    <span className="text-[13px] text-zinc-700 dark:text-zinc-300 truncate flex-1 font-medium">{book.title}</span>
                    <span className="text-[12px] text-zinc-400 dark:text-zinc-500 font-semibold shrink-0">{formatShortTime(session.duration)}</span>
                    <span className="text-[11px] text-zinc-300 dark:text-zinc-600 font-medium shrink-0">{formatDate(session.startTime)}</span>
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

function StatCard({ label, value, suffix, icon }: { label: string; value: string; suffix?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700 relative overflow-hidden group hover:border-zinc-200 dark:hover:border-zinc-600 transition-colors">
      <div className="absolute top-0 left-5 right-5 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300 dark:from-amber-500 dark:to-amber-600 rounded-full" />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[26px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">{value}</span>
        {suffix && <span className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">{suffix}</span>}
      </div>
      <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">{label}</div>
    </div>
  )
}
