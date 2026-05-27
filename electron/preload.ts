import { contextBridge, ipcRenderer, webUtils } from 'electron'

export interface ElectronAPI {
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
  }
  fileUtils: {
    getPathForFile: (file: File) => string
  }
  dialog: {
    openFile: () => Promise<Array<{
      filePath: string
      fileName: string
      fileSize: number
      fileExt: string
      createdAt: number
    }>>
    resolveFiles: (filePaths: string[]) => Promise<Array<{
      filePath: string
      fileName: string
      fileSize: number
      fileExt: string
      createdAt: number
    }>>
  }
  file: {
    readText: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
    readBuffer: (filePath: string) => Promise<{ success: boolean; buffer?: ArrayBuffer; error?: string }>
    getInfo: (filePath: string) => Promise<{ exists: boolean; size?: number; modified?: number }>
  }
  store: {
    get: () => Promise<any>
    set: (data: any) => Promise<boolean>
    setSync: (data: any) => boolean
  }
  export: {
    data: () => Promise<{ success: boolean; error?: string }>
    books: (books: Array<{ filePath: string; title: string; fileExt: string }>) => Promise<{ success: boolean; exported?: string[]; failed?: string[] }>
  }
  import: {
    data: () => Promise<{ success: boolean; error?: string }>
  }
  cover: {
    save: (bookId: string, dataUrl: string) => Promise<{ success: boolean; coverPath?: string; error?: string }>
    read: (coverPath: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },
  fileUtils: {
    getPathForFile: (file: File) => webUtils.getPathForFile(file),
  },
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    resolveFiles: (filePaths: string[]) => ipcRenderer.invoke('dialog:resolveFiles', filePaths),
  },
  file: {
    readText: (filePath: string) => ipcRenderer.invoke('file:readText', filePath),
    readBuffer: (filePath: string) => ipcRenderer.invoke('file:readBuffer', filePath),
    getInfo: (filePath: string) => ipcRenderer.invoke('file:getInfo', filePath),
  },
  store: {
    get: () => ipcRenderer.invoke('store:get'),
    set: (data: any) => ipcRenderer.invoke('store:set', data),
    setSync: (data: any) => ipcRenderer.sendSync('store:setSync', data),
  },
  export: {
    data: () => ipcRenderer.invoke('export:data'),
    books: (books: Array<{ filePath: string; title: string; fileExt: string }>) => ipcRenderer.invoke('export:books', books),
  },
  import: {
    data: () => ipcRenderer.invoke('import:data'),
  },
  cover: {
    save: (bookId: string, dataUrl: string) => ipcRenderer.invoke('cover:save', bookId, dataUrl),
    read: (coverPath: string) => ipcRenderer.invoke('cover:read', coverPath),
  },
} as ElectronAPI)
