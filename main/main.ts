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
      webSecurity: false,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    // Open DevTools to see exact error
    mainWindow.webContents.openDevTools()
    
    const rendererPath = path.join(__dirname, '..', '..', 'renderer', 'index.html')
    console.log('Loading from:', rendererPath)
    
    mainWindow.loadFile(rendererPath).catch((err: any) => {
      console.error('loadFile failed:', err)
      // Try with URL format
      const fileUrl = 'file://' + rendererPath.replace(/\\/g, '/')
      console.log('Trying URL:', fileUrl)
      mainWindow!.loadURL(fileUrl)
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
    const result = await dialog.showOpenDialog(mainWindow!, { properties: ['openDirectory'] })
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
