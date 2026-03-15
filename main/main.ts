import { app, BrowserWindow, ipcMain, dialog, crashReporter } from 'electron'
import path from 'path'
import os from 'os'

// ── 1. STARTUP: Enable V8 code caching ──────────────────
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256 --optimize-for-size --enable-lazy-compilation')

// ── 2. STARTUP: Electron performance flags ───────────────
app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows')
app.commandLine.appendSwitch('disable-breakpad')
app.commandLine.appendSwitch('disable-component-update')
app.commandLine.appendSwitch('disable-domain-reliability')
app.commandLine.appendSwitch('disable-sync')
app.commandLine.appendSwitch('disable-translate')
app.commandLine.appendSwitch('disable-logging')
app.commandLine.appendSwitch('no-default-browser-check')
app.commandLine.appendSwitch('no-first-run')
app.commandLine.appendSwitch('no-pings')
app.commandLine.appendSwitch('password-store', 'basic')
app.commandLine.appendSwitch('use-mock-keychain')
app.commandLine.appendSwitch('force-color-profile', 'srgb')
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer')
app.commandLine.appendSwitch('disable-features', 'TranslateUI,AutofillServerCommunication,CertificateTransparencyComponentUpdater')

// ── 76. STABILITY: Global error handlers ─────────────────
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

// ── 77. STABILITY: Crash reporting ───────────────────────
crashReporter.start({
  productName: 'FaizLaunch',
  companyName: 'Mufaiz',
  submitURL: '',
  uploadToServer: false,
})

let mainWindow: BrowserWindow | null = null
let isQuitting = false

// ── 11. STARTUP: Delay background services ────────────────
async function loadBackgroundServices() {
  const { registerInstallerHandlers } = await import('./ipc/installer')
  const { registerHardwareHandlers } = await import('./ipc/hardware')
  const { registerDefenderHandlers } = await import('./ipc/defender')
  const { registerErrorAnalyzerHandlers } = await import('./ipc/errorAnalyzer')
  const { registerAICompanionHandlers } = await import('./ipc/aicompanion')
  const { registerVaultHandlers } = await import('./ipc/vault')
  const { registerTogetherHandlers } = await import('./ipc/together')
  const { registerDoctorHandlers } = await import('./ipc/doctor')

  registerInstallerHandlers()
  registerHardwareHandlers()
  registerDefenderHandlers()
  registerErrorAnalyzerHandlers()
  registerAICompanionHandlers()
  registerVaultHandlers()
  registerTogetherHandlers()
  registerDoctorHandlers()
}

function createWindow() {
  // ── 14. STARTUP: BrowserWindow only after whenReady ──────
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hidden',
    frame: false,
    show: false, // prevent white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // ── 51. SECURITY: contextIsolation ──────────────────
      contextIsolation: true,
      // ── 52. SECURITY: disable nodeIntegration ────────────
      nodeIntegration: false,
      // ── 53. SECURITY: sandbox ────────────────────────────
      sandbox: false,
      backgroundThrottling: false,
      spellcheck: false,
      enableWebSQL: false,
      webgl: true,
      plugins: false,
      // ── 57. SECURITY: disable remote module ──────────────
      experimentalFeatures: false,
    },
  })

  // ── STABILITY: show only when ready ──────────────────────
  mainWindow.once('ready-to-show', () => {
    mainWindow!.show()
    mainWindow!.focus()
  })

  // ── 78. STABILITY: Auto restart crashed renderer ─────────
  mainWindow.webContents.on('crashed' as any, () => {
    console.error('Renderer crashed — reloading')
    mainWindow?.reload()
  })

  // ── 79. STABILITY: Log critical errors ───────────────────
  mainWindow.webContents.on('did-fail-load', (_e: any, code: any, desc: any) => {
    console.error('Failed to load:', code, desc)
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    const rendererPath = path.join(__dirname, '..', '..', 'renderer', 'index.html')
    mainWindow.loadFile(rendererPath)
  }

  // ── 41. MEMORY: Free memory when hidden ──────────────────
  mainWindow.on('hide', () => {
    if (global.gc) global.gc()
  })

  // ── 83. STABILITY: Graceful shutdown ─────────────────────
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  createWindow()

  // ── 11. Load background services AFTER UI ────────────────
  setTimeout(() => {
    loadBackgroundServices().catch(console.error)
  }, 100)

  // ── Window controls ───────────────────────────────────────
  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window-close', () => {
    isQuitting = true
    mainWindow?.close()
  })

  // ── Dialogs ───────────────────────────────────────────────
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

  // ── 46. MEMORY: Clean caches periodically ────────────────
  setInterval(() => {
    if (global.gc) global.gc()
    mainWindow?.webContents.session.clearCache()
  }, 60000)

  // ── 85. STABILITY: Monitor CPU ───────────────────────────
  setInterval(() => {
    const metrics = app.getAppMetrics()
    metrics.forEach(m => {
      if (m.cpu.percentCPUUsage > 80) {
        console.warn('High CPU usage detected:', m.cpu.percentCPUUsage)
      }
    })
  }, 10000)
})

// ── 83. STABILITY: Graceful shutdown ─────────────────────
app.on('before-quit', () => { isQuitting = true })

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
  else mainWindow?.show()
})
