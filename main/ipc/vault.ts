import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const VAULT_DIR = path.join(os.homedir(), '.faizlaunch', 'vault')
const VAULT_INDEX = path.join(VAULT_DIR, 'index.json')

fs.mkdirSync(VAULT_DIR, { recursive: true })

interface VaultEntry {
  id: string
  gameName: string
  sourcePath: string
  backupPath: string
  size: number
  createdAt: string
  checksum: string
}

function loadIndex(): VaultEntry[] {
  if (fs.existsSync(VAULT_INDEX)) {
    return JSON.parse(fs.readFileSync(VAULT_INDEX, 'utf-8'))
  }
  return []
}

function saveIndex(entries: VaultEntry[]) {
  fs.writeFileSync(VAULT_INDEX, JSON.stringify(entries, null, 2))
}

function getFolderSize(folderPath: string): number {
  let size = 0
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true })
    for (const file of files) {
      const fp = path.join(folderPath, file.name)
      if (file.isDirectory()) {
        size += getFolderSize(fp)
      } else {
        size += fs.statSync(fp).size
      }
    }
  } catch { }
  return size
}

export function registerVaultHandlers() {
  ipcMain.handle('vault:getAll', async () => {
    return loadIndex()
  })

  ipcMain.handle('vault:backup', async (_event, gameName: string, sourcePath: string) => {
    const id = `vault_${Date.now()}`
    const backupPath = path.join(VAULT_DIR, id)
    fs.mkdirSync(backupPath, { recursive: true })

    const windows = BrowserWindow.getAllWindows()

    try {
      // Copy files
      const copyRecursive = (src: string, dest: string) => {
        const items = fs.readdirSync(src, { withFileTypes: true })
        for (const item of items) {
          const srcPath = path.join(src, item.name)
          const destPath = path.join(dest, item.name)
          if (item.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true })
            copyRecursive(srcPath, destPath)
          } else {
            fs.copyFileSync(srcPath, destPath)
          }
          windows.forEach(w => w.webContents.send('vault:progress', { gameName, file: item.name }))
        }
      }

      copyRecursive(sourcePath, backupPath)

      const size = getFolderSize(backupPath)
      const entry: VaultEntry = {
        id,
        gameName,
        sourcePath,
        backupPath,
        size,
        createdAt: new Date().toISOString(),
        checksum: id,
      }

      const index = loadIndex()
      index.push(entry)
      saveIndex(index)

      return { success: true, entry }
    } catch (error: any) {
      fs.rmSync(backupPath, { recursive: true, force: true })
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('vault:restore', async (_event, vaultId: string, restorePath: string) => {
    const index = loadIndex()
    const entry = index.find(e => e.id === vaultId)
    if (!entry) return { success: false, error: 'Vault entry not found' }

    try {
      fs.mkdirSync(restorePath, { recursive: true })
      const copyRecursive = (src: string, dest: string) => {
        const items = fs.readdirSync(src, { withFileTypes: true })
        for (const item of items) {
          const srcPath = path.join(src, item.name)
          const destPath = path.join(dest, item.name)
          if (item.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true })
            copyRecursive(srcPath, destPath)
          } else {
            fs.copyFileSync(srcPath, destPath)
          }
        }
      }
      copyRecursive(entry.backupPath, restorePath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('vault:delete', async (_event, vaultId: string) => {
    const index = loadIndex()
    const entry = index.find(e => e.id === vaultId)
    if (!entry) return { success: false, error: 'Not found' }

    try {
      fs.rmSync(entry.backupPath, { recursive: true, force: true })
      const newIndex = index.filter(e => e.id !== vaultId)
      saveIndex(newIndex)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}