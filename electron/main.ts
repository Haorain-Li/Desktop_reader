import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.on('will-navigate', (e) => {
    e.preventDefault()
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '电子书', extensions: ['txt', 'epub', 'pdf'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  })

  if (result.canceled) return []

  const books = result.filePaths.map((filePath) => {
    const stats = fs.statSync(filePath)
    const fileName = path.basename(filePath, path.extname(filePath))
    return {
      filePath,
      fileName,
      fileSize: stats.size,
      fileExt: path.extname(filePath).slice(1).toLowerCase(),
      createdAt: stats.birthtime.getTime(),
    }
  })

  return books
})

ipcMain.handle('dialog:resolveFiles', async (_event, filePaths: string[]) => {
  return filePaths
    .filter((fp) => {
      const ext = path.extname(fp).slice(1).toLowerCase()
      return ['txt', 'epub', 'pdf'].includes(ext)
    })
    .map((filePath) => {
      const stats = fs.statSync(filePath)
      const fileName = path.basename(filePath, path.extname(filePath))
      return {
        filePath,
        fileName,
        fileSize: stats.size,
        fileExt: path.extname(filePath).slice(1).toLowerCase(),
        createdAt: stats.birthtime.getTime(),
      }
    })
})

ipcMain.handle('file:readText', async (_event, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return { success: true, content }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('file:readBuffer', async (_event, filePath: string) => {
  try {
    const buffer = fs.readFileSync(filePath)
    return {
      success: true,
      buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('file:getInfo', async (_event, filePath: string) => {
  try {
    const stats = fs.statSync(filePath)
    return { exists: true, size: stats.size, modified: stats.mtimeMs }
  } catch {
    return { exists: false }
  }
})

const userDataPath = app.getPath('userData')
const storePath = path.join(userDataPath, 'reader-data.json')
const coversDir = path.join(userDataPath, 'covers')
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true })

ipcMain.handle('store:get', async () => {
  try {
    if (fs.existsSync(storePath)) {
      const data = fs.readFileSync(storePath, 'utf-8')
      return JSON.parse(data)
    }
    return null
  } catch {
    return null
  }
})

ipcMain.handle('store:set', async (_event, data: any) => {
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
})

ipcMain.on('store:setSync', (event, data: any) => {
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8')
    event.returnValue = true
  } catch {
    event.returnValue = false
  }
})

ipcMain.handle('import:data', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return { success: false }

  try {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8')
    const data = JSON.parse(content)
    if (!data || !Array.isArray(data.books)) {
      return { success: false, error: '文件格式不正确，缺少 books 字段' }
    }
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || '导入失败' }
  }
})

ipcMain.handle('export:data', async () => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: 'reader-data.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (result.canceled || !result.filePath) return { success: false }

  try {
    if (fs.existsSync(storePath)) {
      fs.copyFileSync(storePath, result.filePath)
      return { success: true }
    }
    return { success: false, error: '没有找到数据文件' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('export:books', async (_event, books: Array<{ filePath: string; title: string; fileExt: string }>) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: '选择导出目录',
  })
  if (result.canceled || result.filePaths.length === 0) return { success: false }

  const destDir = result.filePaths[0]
  const exported: string[] = []
  const failed: string[] = []

  for (const book of books) {
    try {
      if (!fs.existsSync(book.filePath)) {
        failed.push(book.title)
        continue
      }
      const safeName = book.title.replace(/[\\/:*?"<>|]/g, '_')
      const destPath = path.join(destDir, `${safeName}.${book.fileExt}`)
      fs.copyFileSync(book.filePath, destPath)
      exported.push(book.title)
    } catch {
      failed.push(book.title)
    }
  }

  return { success: true, exported, failed }
})

ipcMain.handle('cover:save', async (_event, bookId: string, dataUrl: string) => {
  try {
    const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) return { success: false, error: 'Invalid data URL' }
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
    const buffer = Buffer.from(matches[2], 'base64')
    const fileName = `${bookId}.${ext}`
    const filePath = path.join(coversDir, fileName)
    fs.writeFileSync(filePath, buffer)
    return { success: true, coverPath: filePath }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('cover:read', async (_event, coverPath: string) => {
  try {
    if (!fs.existsSync(coverPath)) return { success: false, error: 'Cover not found' }
    const buffer = fs.readFileSync(coverPath)
    const ext = path.extname(coverPath).slice(1)
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
    return { success: true, dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})
