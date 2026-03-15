import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { registerInstallerHandlers } from './ipc/installer'
import { registerHardwareHandlers } from './ipc/hardware'
import { registerDefenderHandlers } from './ipc/defender'
import { registerErrorAnalyzerHandlers } from './ipc/errorAnalyzer'
import { registerAICompanionHandlers } from './ipc/aicompanion'
import { registerVaultHandlers } from './ipc/vault'
import { registerTogetherHandlers } from './ipc/together'
import { registerDoctorHandlers } from './ipc/doctor'

let mainWindow: BrowserWindow | null = null

function getRendererPath() {
  // __dirname in production = dist/main/main/
  // we need to go up 3 levels to project root, then into dist/renderer
  const rendererPath = path.join(__dirname, '..', '..', '..', 'dist', 'renderer', 'index.html')
  console.log('Loading renderer from:', rendererPath)
  return rendererPath
}

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
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    const rendererPath = getRendererPath()
    mainWindow.loadFile(rendererPath).catch(err => {
      console.error('Failed to load renderer:', err)
      // Fallback — try different relative paths
      const fallback = path.join(__dirname, '..', '..', 'renderer', 'index.html')
      console.log('Trying fallback:', fallback)
      mainWindow!.loadFile(fallback).catch(err2 => {
        console.error('Fallback also failed:', err2)
        mainWindow!.loadURL(`data:text/html,<h1>Error loading FaizLaunch UI</h1><p>${err.message}</p><p>Path tried: ${rendererPath}</p>`)
      })
    })
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  createWindow()

  registerInstallerHandlers()
  registerHardwareHandlers()
  registerDefenderHandlers()
  registerErrorAnalyzerHandlers()
  registerAICompanionHandlers()
  registerVaultHandlers()
  registerTogetherHandlers()
  registerDoctorHandlers()

  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window-close', () => mainWindow?.close())

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    })
    return result.filePaths[0] || null
  })

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
