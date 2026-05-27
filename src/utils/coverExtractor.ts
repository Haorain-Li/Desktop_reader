import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export async function extractEpubCover(filePath: string): Promise<string | null> {
  const result = await window.electronAPI.file.readBuffer(filePath)
  if (!result.success || !result.buffer) return null

  const ePubModule = await import('epubjs')
  const ePub = ePubModule.default || ePubModule
  const book = ePub(result.buffer)
  try {
    const coverUrl = await book.coverUrl()
    if (!coverUrl) return null

    const response = await fetch(coverUrl)
    const blob = await response.blob()

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  } finally {
    book.destroy()
  }
}

export async function extractPdfCover(filePath: string): Promise<string | null> {
  const result = await window.electronAPI.file.readBuffer(filePath)
  if (!result.success || !result.buffer) return null

  try {
    const pdf = await pdfjs.getDocument({ data: result.buffer }).promise
    const page = await pdf.getPage(1)

    const desiredWidth = 400
    const viewport = page.getViewport({ scale: 1 })
    const scale = desiredWidth / viewport.width
    const scaledViewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return null

    await page.render({ canvas, canvasContext: ctx, viewport: scaledViewport }).promise

    const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
    canvas.width = 0
    canvas.height = 0
    pdf.destroy()

    return dataUrl
  } catch {
    return null
  }
}
