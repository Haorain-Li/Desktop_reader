import { useEffect, useRef, useState, useCallback } from 'react'
import type { Book } from '@/types'
import { ReaderToolbar } from './ReaderToolbar'

interface EpubReaderProps {
  book: Book
  onClose: () => void
  elapsed: number
  onProgressUpdate: (progress: number, progressData?: string) => void
  theme?: 'light' | 'dark'
  toggleTheme?: () => void
  onAddBookmark?: (label: string, cfi?: string) => void
  onRemoveBookmark?: (bookmarkId: string) => void
}

interface TocItem { label: string; href: string; subitems?: TocItem[] }

type FlowMode = 'paginated' | 'scrolled'

export function EpubReader({ book, onClose, elapsed, onProgressUpdate, theme, toggleTheme, onAddBookmark, onRemoveBookmark }: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<any>(null)
  const renditionRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toc, setToc] = useState<TocItem[]>([])
  const [showToc, setShowToc] = useState(false)
  const showTocRef = useRef(showToc)
  showTocRef.current = showToc
  const setShowTocRef = useRef(setShowToc)
  setShowTocRef.current = setShowToc
  const [fontSize, setFontSize] = useState(20)
  const [flowMode, setFlowMode] = useState<FlowMode>(() => {
    const saved = localStorage.getItem('epub-flow-mode')
    return (saved === 'scrolled' || saved === 'paginated') ? saved : 'paginated'
  })
  const progressRef = useRef(onProgressUpdate)
  progressRef.current = onProgressUpdate
  const currentCfiRef = useRef<string | null>(book.progressData || null)
  const themeRef = useRef(theme)
  themeRef.current = theme
  const [showBookmarks, setShowBookmarks] = useState(false)
  const onAddBookmarkRef = useRef(onAddBookmark)
  onAddBookmarkRef.current = onAddBookmark

  useEffect(() => {
    let cancelled = false
    let innerCleanup: (() => void) | null = null

    async function init() {
      await new Promise(r => requestAnimationFrame(r))
      if (cancelled) return

      const container = containerRef.current
      if (!container || container.clientWidth === 0) {
        if (!cancelled) { setError('渲染容器未就绪'); setLoading(false) }
        return
      }

      setLoading(true); setError(null)

      const result = await window.electronAPI.file.readBuffer(book.filePath)
      if (cancelled) return
      if (!result.success || !result.buffer) {
        setError(result.error || '无法读取文件')
        setLoading(false)
        return
      }

      try {
        const ePubModule = await import('epubjs')
        const ePub = ePubModule.default || ePubModule

        const epubBook = ePub(result.buffer)
        bookRef.current = epubBook

        const rendition = epubBook.renderTo(container, {
          width: container.clientWidth || '100%',
          height: container.clientHeight || '100%',
          spread: 'none',
          flow: flowMode === 'scrolled' ? 'scrolled-doc' : 'paginated',
        })
        renditionRef.current = rendition

        // Apply theme based on current mode
        const isDark = themeRef.current === 'dark'
        rendition.themes.default({
          body: { 'font-family': "'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', serif !important", 'color': isDark ? '#e4e4e7 !important' : '#1a1a1a !important', 'background-color': isDark ? '#18181b !important' : '#ffffff !important' },
          p: { 'line-height': '2 !important' },
        })
        rendition.themes.fontSize(`${fontSize}px`)

        epubBook.loaded.navigation.then((nav: any) => {
          if (!cancelled) setToc(nav.toc || [])
        })

        await rendition.display(currentCfiRef.current || undefined)
        if (cancelled) return
        setLoading(false)

        rendition.on('relocated', (loc: any) => {
          if (cancelled) return
          const cfi = loc?.start?.cfi || loc?.cfi
          if (!cfi) return
          currentCfiRef.current = cfi
          if (epubBook.locations?.length() > 0) {
            const pct = Math.round((epubBook.locations.percentageFromCfi(cfi) || 0) * 100)
            progressRef.current(pct, cfi)
          }
        })

        // Inject "Next Chapter" button at the end of each section (scrolled mode)
        if (flowMode === 'scrolled') {
          const totalSections = (epubBook.spine as any)?.items?.length || (epubBook.spine as any)?.length || 0
          const injectedSet = new Set<string>()

          const injectNextBtn = (section: any) => {
            try {
              const key = section?.href || section?.idref || ''
              if (!key || injectedSet.has(key)) return
              injectedSet.add(key)

              const idx = section?.index ?? -1
              if (idx < 0 || idx >= totalSections - 1) return

              const doc = section?.document
              if (!doc?.body) return
              if (doc.getElementById('next-chapter-btn')) return

              const wrapper = doc.createElement('div')
              wrapper.id = 'next-chapter-btn'
              wrapper.style.cssText = 'text-align:center;padding:40px 0 20px;margin-top:20px;border-top:1px solid #e5e5e5;'

              const btn = doc.createElement('button')
              btn.textContent = '下一章 →'
              btn.style.cssText = 'display:inline-flex;align-items:center;gap:8px;padding:12px 32px;background:#18181b;color:#fff;border:none;border-radius:16px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;'
              btn.onmouseenter = () => { btn.style.background = '#27272a'; btn.style.transform = 'scale(1.03)' }
              btn.onmouseleave = () => { btn.style.background = '#18181b'; btn.style.transform = 'scale(1)' }
              btn.onclick = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); rendition.next() }

              wrapper.appendChild(btn)
              doc.body.appendChild(wrapper)
            } catch { /* skip */ }
          }

          rendition.on('rendered', (section: any) => {
            if (cancelled) return
            injectNextBtn(section)
          })
        }

        setTimeout(() => {
          if (cancelled) return
          epubBook.locations.generate(100).then(() => {
            if (cancelled) return
            const cur = rendition.currentLocation() as any
            const cfi = cur?.start?.cfi || cur?.cfi
            if (cfi) {
              const pct = Math.round((epubBook.locations.percentageFromCfi(cfi) || 0) * 100)
              progressRef.current(pct, cfi)
            }
          })
        }, 500)

        let wheelTimer: ReturnType<typeof setTimeout> | null = null
        const onWheel = (e: WheelEvent) => {
          if (flowMode === 'scrolled') return
          if (wheelTimer) return
          wheelTimer = setTimeout(() => { wheelTimer = null }, 250)
          if (e.deltaY > 20) rendition.next()
          else if (e.deltaY < -20) rendition.prev()
        }
        container.addEventListener('wheel', onWheel, { passive: true })

        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            if (showTocRef.current) {
              setShowTocRef.current(false)
            } else {
              onClose()
            }
            return
          }
          if (flowMode === 'scrolled') return
          if (e.key === 'ArrowLeft' || e.key === 'PageUp') rendition.prev()
          if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
            e.preventDefault(); rendition.next()
          }
        }
        window.addEventListener('keydown', onKey)

        innerCleanup = () => {
          window.removeEventListener('keydown', onKey)
          container.removeEventListener('wheel', onWheel)
        }
      } catch (err: any) {
        if (!cancelled) { setError('EPUB 加载失败: ' + (err.message || '')); setLoading(false) }
      }
    }

    init()

    return () => {
      cancelled = true
      innerCleanup?.()
      try { renditionRef.current?.destroy() } catch {}
      try { bookRef.current?.destroy() } catch {}
      renditionRef.current = null
      bookRef.current = null
    }
  }, [book.filePath, flowMode, onClose])

  // Sync font size
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${fontSize}px`)
    }
  }, [fontSize])

  // Sync theme
  useEffect(() => {
    if (renditionRef.current) {
      const isDark = theme === 'dark'
      renditionRef.current.themes.default({
        body: { 'font-family': "'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', serif !important", 'color': isDark ? '#e4e4e7 !important' : '#1a1a1a !important', 'background-color': isDark ? '#18181b !important' : '#ffffff !important' },
        p: { 'line-height': '2 !important' },
      })
    }
  }, [theme])

  const goNext = useCallback(() => renditionRef.current?.next(), [])
  const goPrev = useCallback(() => renditionRef.current?.prev(), [])
  const navigateTo = useCallback((href: string) => { renditionRef.current?.display(href); setShowToc(false) }, [])
  const changeFontSize = useCallback((size: number) => { setFontSize(size) }, [])
  const toggleFlowMode = useCallback(() => {
    setFlowMode(prev => {
      const next = prev === 'paginated' ? 'scrolled' : 'paginated'
      localStorage.setItem('epub-flow-mode', next)
      return next
    })
  }, [])

  const renderTocItem = (item: TocItem, depth: number = 0) => (
    <div key={item.href + depth}>
      <button onClick={() => navigateTo(item.href)}
        className="w-full text-left px-4 py-2.5 text-[13px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors truncate rounded-lg font-medium"
        style={{ paddingLeft: `${16 + depth * 20}px` }} title={item.label}>
        {item.label}
      </button>
      {item.subitems?.map((sub) => renderTocItem(sub, depth + 1))}
    </div>
  )

  return (
    <div className="flex-1 flex flex-col relative bg-white dark:bg-zinc-900">
      <ReaderToolbar title={book.title} onClose={onClose} elapsed={elapsed} theme={theme} toggleTheme={toggleTheme}>
        <button onClick={() => setShowToc(!showToc)}
          className={`px-3.5 py-1.5 text-[13px] rounded-lg font-bold transition-colors ${
            showToc ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600'
          }`}>目录</button>
        {onAddBookmark && (
          <button onClick={() => {
            const cfi = currentCfiRef.current
            if (cfi) onAddBookmark(`书签 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`, cfi)
          }}
            className="px-3.5 py-1.5 text-[13px] rounded-lg font-bold transition-colors bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600"
            title="添加书签">书签</button>
        )}
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-600" />
        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
          <button onClick={() => changeFontSize(Math.max(14, fontSize - 2))} className="px-3 py-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-bold transition-colors">A-</button>
          <span className="text-[13px] text-zinc-400 dark:text-zinc-500 w-7 text-center font-bold">{fontSize}</span>
          <button onClick={() => changeFontSize(Math.min(32, fontSize + 2))} className="px-3 py-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-bold transition-colors">A+</button>
        </div>
      </ReaderToolbar>

      <div className="flex-1 relative overflow-hidden">
        {showToc && (
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 z-30 overflow-y-auto shadow-xl">
            <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-700">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">目录</span>
            </div>
            <div className="py-1.5">
              {toc.length > 0 ? toc.map((item) => renderTocItem(item)) : (
                <div className="px-5 py-6 text-xs text-zinc-400 dark:text-zinc-500 text-center font-medium">暂无目录</div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 z-20 gap-3">
            <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">正在加载...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-zinc-900 z-20">
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

        <div ref={containerRef} className={`w-full h-full ${flowMode === 'scrolled' ? 'epub-scrolled' : ''}`} />

        {!loading && !error && flowMode === 'paginated' && (
          <>
            <div className="absolute inset-y-0 left-0 w-1/4 cursor-pointer z-10 flex items-center justify-start pl-4 group/nav" onClick={goPrev}>
              <div className="w-9 h-9 rounded-xl bg-zinc-100/80 dark:bg-zinc-700/80 group-hover/nav:bg-zinc-200 dark:group-hover/nav:bg-zinc-600 flex items-center justify-center transition-all opacity-0 group-hover/nav:opacity-100">
                <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 w-1/4 cursor-pointer z-10 flex items-center justify-end pr-4 group/nav" onClick={goNext}>
              <div className="w-9 h-9 rounded-xl bg-zinc-100/80 dark:bg-zinc-700/80 group-hover/nav:bg-zinc-200 dark:group-hover/nav:bg-zinc-600 flex items-center justify-center transition-all opacity-0 group-hover/nav:opacity-100">
                <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </div>
            </div>
          </>
        )}

        {!loading && !error && (
          <button
            onClick={toggleFlowMode}
            className="absolute bottom-5 right-5 z-20 w-10 h-10 rounded-xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-600 shadow-lg shadow-black/5 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-xl transition-all"
            title={flowMode === 'paginated' ? '切换滚动阅读' : '切换翻页阅读'}
          >
            {flowMode === 'paginated' ? (
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
