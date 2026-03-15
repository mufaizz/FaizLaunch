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
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    const appPath = app.getAppPath()
    const dirName = __dirname
    
    // Try all possible paths
    const paths = [
      path.join(appPath, 'dist', 'renderer', 'index.html'),
      path.join(appPath, '..', 'dist', 'renderer', 'index.html'),
      path.join(dirName, '..', '..', '..', 'dist', 'renderer', 'index.html'),
      path.join(dirName, '..', '..', 'renderer', 'index.html'),
    ]

    const fs = require('fs')
    let loaded = false

    for (const p of paths) {
      if (fs.existsSync(p)) {
        console.log('Found renderer at:', p)
        mainWindow!.loadFile(p)
        loaded = true
        break
      }
    }

    if (!loaded) {
      const debugHTML = `
        <html>
        <body style="background:#0a0a0f;color:#f5a623;font-family:monospace;padding:20px">
        <h1>⚡ FaizLaunch Debug</h1>
        <p><b>appPath:</b> ${appPath}</p>
        <p><b>__dirname:</b> ${dirName}</p>
        <p><b>Paths tried:</b></p>
        <ul>${paths.map(p => `<li style="color:${fs.existsSync(p)?'#43d98c':'#ff4757'}">${p} — ${fs.existsSync(p)?'EXISTS':'NOT FOUND'}</li>`).join('')}</ul>
        </body>
        </html>
      `
      mainWindow!.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(debugHTML))
    }
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
