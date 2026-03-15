import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { registerInstallerHandlers } from './ipc/installer'
import { registerHardwareHandlers } from './ipc/hardware'
import { registerDefenderHandlers } from './ipc/defender'
import { registerErrorAnalyzerHandlers } from './ipc/errorAnalyzer'
import { registerVaultHandlers } from './ipc/vault'
import { registerAICompanionHandlers } from './ipc/aicompanion'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()
  registerVaultHandlers()
  registerAICompanionHandlers()

  // Register all IPC handlers
  registerInstallerHandlers()
  registerHardwareHandlers()
  registerDefenderHandlers()
  registerErrorAnalyzerHandlers()

  // Window controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window-close', () => mainWindow?.close())

  // Folder picker
  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    })
    return result.filePaths[0] || null
  })

  // File picker
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'Archives', extensions: ['rar', 'zip', '7z', 'tar', 'iso'] },
        { name: 'Executables', extensions: ['exe'] },
      ],
    })
    return result.filePaths[0] || null
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})