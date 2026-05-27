import { useState } from 'react'
import type { Book } from '@/types'
import { ConfirmModal } from './ConfirmModal'

interface SyncViewProps {
  books: Book[]
  reloadData: () => Promise<void>
}

export function SyncView({ books, reloadData }: SyncViewProps) {
  const [busy, setBusy] = useState<string | null>(null)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleImportData = async () => {
    setShowImportConfirm(false)
    setBusy('import')
    try {
      const res = await window.electronAPI.import.data()
      if (res.success) {
        await reloadData()
        showToast('阅读数据导入成功')
      } else if (res.error) {
        showToast('导入失败: ' + res.error)
      }
    } finally {
      setBusy(null)
    }
  }

  const handleExportData = async () => {
    setBusy('data')
    try {
      const res = await window.electronAPI.export.data()
      if (res.success) showToast('阅读数据导出成功')
      else if (res.error) showToast('导出失败: ' + res.error)
    } finally {
      setBusy(null)
    }
  }

  const handleExportBooks = async () => {
    if (books.length === 0) { showToast('书架没有书籍'); return }
    setBusy('books')
    try {
      const list = books.map((b) => ({ filePath: b.filePath, title: b.title, fileExt: b.fileExt }))
      const res = await window.electronAPI.export.books(list)
      if (res.success) {
        const msg = [`成功导出 ${res.exported?.length} 本`]
        if (res.failed && res.failed.length > 0) msg.push(`失败 ${res.failed.length} 本: ${res.failed.join('、')}`)
        showToast(msg.join('\n'))
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto relative">
      <div className="px-10 pt-10 pb-6">
        <h1 className="text-[28px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">数据同步</h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2 font-medium">导入导出阅读数据和书籍文件，便于备份或迁移到其他设备</p>
      </div>

      <div className="px-10 pb-10 space-y-5">
        <button
          onClick={() => setShowImportConfirm(true)}
          disabled={busy !== null}
          className="w-full flex items-center gap-5 p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
            <svg className="w-7 h-7 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">导入阅读数据</div>
            <div className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-0.5">从 JSON 文件恢复书架信息、阅读进度、阅读时长等数据</div>
          </div>
          {busy === 'import' && (
            <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin shrink-0" />
          )}
        </button>

        <button
          onClick={handleExportData}
          disabled={busy !== null}
          className="w-full flex items-center gap-5 p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
            <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">导出阅读数据</div>
            <div className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-0.5">导出书架信息、阅读进度、阅读时长等数据为 JSON 文件</div>
          </div>
          {busy === 'data' && (
            <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin shrink-0" />
          )}
        </button>

        <button
          onClick={handleExportBooks}
          disabled={busy !== null}
          className="w-full flex items-center gap-5 p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
            <svg className="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 12 15 15" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">导出书籍文件</div>
            <div className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-0.5">将书架中 {books.length} 本电子书的原始文件导出到指定文件夹</div>
          </div>
          {busy === 'books' && (
            <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin shrink-0" />
          )}
        </button>
      </div>

      <ConfirmModal
        open={showImportConfirm}
        title="导入阅读数据"
        message="导入将覆盖当前所有书架数据，此操作不可撤销。建议先导出当前数据作为备份。"
        confirmText="确认导入"
        variant="danger"
        onConfirm={handleImportData}
        onCancel={() => setShowImportConfirm(false)}
      />

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium px-5 py-3 rounded-xl shadow-lg shadow-black/20 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
