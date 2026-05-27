"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let mainWindow = null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    if (VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.webContents.on('will-navigate', (e) => {
        e.preventDefault();
    });
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
electron_1.ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
});
electron_1.ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    }
    else {
        mainWindow?.maximize();
    }
});
electron_1.ipcMain.handle('window:close', () => {
    mainWindow?.close();
});
electron_1.ipcMain.handle('dialog:openFile', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: '电子书', extensions: ['txt', 'epub', 'pdf'] },
            { name: '所有文件', extensions: ['*'] },
        ],
    });
    if (result.canceled)
        return [];
    const books = result.filePaths.map((filePath) => {
        const stats = fs_1.default.statSync(filePath);
        const fileName = path_1.default.basename(filePath, path_1.default.extname(filePath));
        return {
            filePath,
            fileName,
            fileSize: stats.size,
            fileExt: path_1.default.extname(filePath).slice(1).toLowerCase(),
            createdAt: stats.birthtime.getTime(),
        };
    });
    return books;
});
electron_1.ipcMain.handle('dialog:resolveFiles', async (_event, filePaths) => {
    return filePaths
        .filter((fp) => {
        const ext = path_1.default.extname(fp).slice(1).toLowerCase();
        return ['txt', 'epub', 'pdf'].includes(ext);
    })
        .map((filePath) => {
        const stats = fs_1.default.statSync(filePath);
        const fileName = path_1.default.basename(filePath, path_1.default.extname(filePath));
        return {
            filePath,
            fileName,
            fileSize: stats.size,
            fileExt: path_1.default.extname(filePath).slice(1).toLowerCase(),
            createdAt: stats.birthtime.getTime(),
        };
    });
});
electron_1.ipcMain.handle('file:readText', async (_event, filePath) => {
    try {
        const content = fs_1.default.readFileSync(filePath, 'utf-8');
        return { success: true, content };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('file:readBuffer', async (_event, filePath) => {
    try {
        const buffer = fs_1.default.readFileSync(filePath);
        return {
            success: true,
            buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('file:getInfo', async (_event, filePath) => {
    try {
        const stats = fs_1.default.statSync(filePath);
        return { exists: true, size: stats.size, modified: stats.mtimeMs };
    }
    catch {
        return { exists: false };
    }
});
const userDataPath = electron_1.app.getPath('userData');
const storePath = path_1.default.join(userDataPath, 'reader-data.json');
const coversDir = path_1.default.join(userDataPath, 'covers');
if (!fs_1.default.existsSync(coversDir))
    fs_1.default.mkdirSync(coversDir, { recursive: true });
electron_1.ipcMain.handle('store:get', async () => {
    try {
        if (fs_1.default.existsSync(storePath)) {
            const data = fs_1.default.readFileSync(storePath, 'utf-8');
            return JSON.parse(data);
        }
        return null;
    }
    catch {
        return null;
    }
});
electron_1.ipcMain.handle('store:set', async (_event, data) => {
    try {
        fs_1.default.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    }
    catch {
        return false;
    }
});
electron_1.ipcMain.on('store:setSync', (event, data) => {
    try {
        fs_1.default.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8');
        event.returnValue = true;
    }
    catch {
        event.returnValue = false;
    }
});
electron_1.ipcMain.handle('import:data', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || result.filePaths.length === 0)
        return { success: false };
    try {
        const content = fs_1.default.readFileSync(result.filePaths[0], 'utf-8');
        const data = JSON.parse(content);
        if (!data || !Array.isArray(data.books)) {
            return { success: false, error: '文件格式不正确，缺少 books 字段' };
        }
        fs_1.default.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message || '导入失败' };
    }
});
electron_1.ipcMain.handle('export:data', async () => {
    const result = await electron_1.dialog.showSaveDialog(mainWindow, {
        defaultPath: 'reader-data.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath)
        return { success: false };
    try {
        if (fs_1.default.existsSync(storePath)) {
            fs_1.default.copyFileSync(storePath, result.filePath);
            return { success: true };
        }
        return { success: false, error: '没有找到数据文件' };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('export:books', async (_event, books) => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: '选择导出目录',
    });
    if (result.canceled || result.filePaths.length === 0)
        return { success: false };
    const destDir = result.filePaths[0];
    const exported = [];
    const failed = [];
    for (const book of books) {
        try {
            if (!fs_1.default.existsSync(book.filePath)) {
                failed.push(book.title);
                continue;
            }
            const safeName = book.title.replace(/[\\/:*?"<>|]/g, '_');
            const destPath = path_1.default.join(destDir, `${safeName}.${book.fileExt}`);
            fs_1.default.copyFileSync(book.filePath, destPath);
            exported.push(book.title);
        }
        catch {
            failed.push(book.title);
        }
    }
    return { success: true, exported, failed };
});
electron_1.ipcMain.handle('cover:save', async (_event, bookId, dataUrl) => {
    try {
        const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches)
            return { success: false, error: 'Invalid data URL' };
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const fileName = `${bookId}.${ext}`;
        const filePath = path_1.default.join(coversDir, fileName);
        fs_1.default.writeFileSync(filePath, buffer);
        return { success: true, coverPath: filePath };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('cover:read', async (_event, coverPath) => {
    try {
        if (!fs_1.default.existsSync(coverPath))
            return { success: false, error: 'Cover not found' };
        const buffer = fs_1.default.readFileSync(coverPath);
        const ext = path_1.default.extname(coverPath).slice(1);
        const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        return { success: true, dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}` };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
//# sourceMappingURL=main.js.map