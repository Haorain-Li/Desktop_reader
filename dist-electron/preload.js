"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    window: {
        minimize: () => electron_1.ipcRenderer.invoke('window:minimize'),
        maximize: () => electron_1.ipcRenderer.invoke('window:maximize'),
        close: () => electron_1.ipcRenderer.invoke('window:close'),
    },
    fileUtils: {
        getPathForFile: (file) => electron_1.webUtils.getPathForFile(file),
    },
    dialog: {
        openFile: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
        resolveFiles: (filePaths) => electron_1.ipcRenderer.invoke('dialog:resolveFiles', filePaths),
    },
    file: {
        readText: (filePath) => electron_1.ipcRenderer.invoke('file:readText', filePath),
        readBuffer: (filePath) => electron_1.ipcRenderer.invoke('file:readBuffer', filePath),
        getInfo: (filePath) => electron_1.ipcRenderer.invoke('file:getInfo', filePath),
    },
    store: {
        get: () => electron_1.ipcRenderer.invoke('store:get'),
        set: (data) => electron_1.ipcRenderer.invoke('store:set', data),
        setSync: (data) => electron_1.ipcRenderer.sendSync('store:setSync', data),
    },
    export: {
        data: () => electron_1.ipcRenderer.invoke('export:data'),
        books: (books) => electron_1.ipcRenderer.invoke('export:books', books),
    },
    import: {
        data: () => electron_1.ipcRenderer.invoke('import:data'),
    },
    cover: {
        save: (bookId, dataUrl) => electron_1.ipcRenderer.invoke('cover:save', bookId, dataUrl),
        read: (coverPath) => electron_1.ipcRenderer.invoke('cover:read', coverPath),
    },
});
//# sourceMappingURL=preload.js.map