import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'
import { InstallJob, Checkpoint } from '../../shared/types'

const CHECKPOINT_DIR = path.join(os.homedir(), '.faizlaunch', 'checkpoints')
const JOBS_FILE = path.join(os.homedir(), '.faizlaunch', 'jobs.json')

fs.mkdirSync(CHECKPOINT_DIR, { recursive: true })

const activeJobs = new Map<string, { cancelled: boolean; paused: boolean }>()

// ── EXTRACTOR DETECTION ───────────────────────────────────
function findExtractor(): { path: string; type: 'winrar' | '7zip' | 'windows' } | null {
  const winrarPaths = [
    'C:\\Program Files\\WinRAR\\WinRAR.exe',
    'C:\\Program Files (x86)\\WinRAR\\WinRAR.exe',
    `C:\\Users\\${os.userInfo().username}\\AppData\\Local\\Programs\\WinRAR\\WinRAR.exe`,
  ]

  const sevenZipPaths = [
    'C:\\Program Files\\7-Zip\\7z.exe',
    'C:\\Program Files (x86)\\7-Zip\\7z.exe',
    'C:\\Program Files\\7-Zip\\7za.exe',
    'C:\\Program Files (x86)\\7-Zip\\7za.exe',
  ]

  // 1. Check WinRAR first
  for (const p of winrarPaths) {
    if (fs.existsSync(p)) {
      console.log('Found WinRAR at:', p)
      return { path: p, type: 'winrar' }
    }
  }

  // 2. Check 7-Zip
  for (const p of sevenZipPaths) {
    if (fs.existsSync(p)) {
      console.log('Found 7-Zip at:', p)
      return { path: p, type: '7zip' }
    }
  }

  // 3. Fall back to Windows built-in tar/expand
  const windowsExpand = 'C:\\Windows\\System32\\expand.exe'
  const windowsTar = 'C:\\Windows\\System32\\tar.exe'
  if (fs.existsSync(windowsTar)) {
    console.log('Using Windows built-in tar')
    return { path: windowsTar, type: 'windows' }
  }
  if (fs.existsSync(windowsExpand)) {
    return { path: windowsExpand, type: 'windows' }
  }

  return null
}

function saveCheckpoint(checkpoint: Checkpoint) {
  const file = path.join(CHECKPOINT_DIR, `${checkpoint.jobId}.json`)
  fs.writeFileSync(file, JSON.stringify(checkpoint, null, 2))
}

function loadCheckpoint(jobId: string): Checkpoint | null {
  const file = path.join(CHECKPOINT_DIR, `${jobId}.json`)
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  }
  return null
}

function deleteCheckpoint(jobId: string) {
  const file = path.join(CHECKPOINT_DIR, `${jobId}.json`)
  if (fs.existsSync(file)) fs.unlinkSync(file)
}

function saveJob(job: InstallJob) {
  let jobs: InstallJob[] = []
  if (fs.existsSync(JOBS_FILE)) {
    jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'))
  }
  const index = jobs.findIndex(j => j.id === job.id)
  if (index >= 0) jobs[index] = job
  else jobs.push(job)
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2))
}

function getAllJobs(): InstallJob[] {
  if (fs.existsSync(JOBS_FILE)) {
    return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'))
  }
  return []
}

function sendProgress(jobId: string, progress: number, currentFile: string, status: string) {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach(win => {
    win.webContents.send('installer:progress', { jobId, progress, currentFile, status })
  })
}

function extractWithWinRAR(extractorPath: string, job: InstallJob): Promise<void> {
  return new Promise((resolve, reject) => {
    // WinRAR command: x = extract with full paths, -y = yes to all, -o+ = overwrite
    const args = ['x', '-y', `-o+${job.destinationPath}`, job.sourcePath]
    const proc = spawn(extractorPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })

    let progress = 0
    let currentFile = ''

    proc.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n')
      lines.forEach(line => {
        if (line.includes('%')) {
          const match = line.match(/(\d+)%/)
          if (match) {
            progress = parseInt(match[1])
            sendProgress(job.id, progress, currentFile, 'extracting')
          }
        }
        if (line.trim().length > 0 && !line.includes('%')) {
          currentFile = line.trim()
          sendProgress(job.id, progress, currentFile, 'extracting')
        }
      })
    })

    proc.stderr.on('data', (data: Buffer) => {
      console.error('WinRAR stderr:', data.toString())
    })

    proc.on('close', (code) => {
      if (code === 0 || code === 1) resolve() // WinRAR returns 1 for warnings (ok)
      else reject(new Error(`WinRAR failed with code ${code}`))
    })

    proc.on('error', (err) => reject(err))
  })
}

function extractWith7Zip(extractorPath: string, job: InstallJob): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['x', job.sourcePath, `-o${job.destinationPath}`, '-y', '-aoa']
    const proc = spawn(extractorPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })

    let progress = 0
    let currentFile = ''
    let fileCount = 0

    proc.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n')
      lines.forEach(line => {
        if (line.includes('%')) {
          const match = line.match(/(\d+)%/)
          if (match) {
            progress = parseInt(match[1])
            sendProgress(job.id, progress, currentFile, 'extracting')
          }
        }
        if (line.startsWith('Extracting')) {
          currentFile = line.replace('Extracting  ', '').trim()
          fileCount++
          if (fileCount % 50 === 0) {
            saveCheckpoint({
              jobId: job.id,
              progress,
              extractedFiles: [],
              lastFile: currentFile,
              timestamp: new Date().toISOString(),
            })
          }
        }
        const control = activeJobs.get(job.id)
        if (control?.cancelled) {
          proc.kill()
          reject(new Error('CANCELLED'))
        }
      })
    })

    proc.stderr.on('data', (data: Buffer) => {
      const error = data.toString()
      if (error.includes('ERROR')) reject(new Error(error))
    })

    proc.on('close', (code) => {
      if (code === 0) resolve()
      else if (code !== null) reject(new Error(`7-Zip failed with code ${code}`))
    })

    proc.on('error', (err) => reject(err))
  })
}

async function extractArchive(job: InstallJob, _checkpoint: Checkpoint | null): Promise<void> {
  const extractor = findExtractor()

  if (!extractor) {
    throw new Error(
      'No extractor found.\n\n' +
      'FaizLaunch needs WinRAR or 7-Zip to extract games.\n\n' +
      'Please install one:\n' +
      '• WinRAR: https://www.rarlab.com/download.htm\n' +
      '• 7-Zip: https://www.7-zip.org/download.html\n\n' +
      'After installing, try again.'
    )
  }

  sendProgress(job.id, 0, `Using ${extractor.type} to extract...`, 'extracting')

  if (extractor.type === 'winrar') {
    await extractWithWinRAR(extractor.path, job)
  } else if (extractor.type === '7zip') {
    await extractWith7Zip(extractor.path, job)
  } else {
    throw new Error('Windows built-in extractor does not support .rar files. Please install WinRAR or 7-Zip.')
  }
}

export function registerInstallerHandlers() {
  ipcMain.handle('installer:start', async (_event: any, jobData: Partial<InstallJob>) => {
    const job: InstallJob = {
      id: jobData.id || `job_${Date.now()}`,
      name: jobData.name || 'Unknown Game',
      sourcePath: jobData.sourcePath!,
      destinationPath: jobData.destinationPath!,
      totalSize: jobData.totalSize || 0,
      extractedSize: 0,
      status: 'extracting',
      progress: 0,
      currentFile: '',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const checkpoint = loadCheckpoint(job.id)
    if (checkpoint) {
      job.progress = checkpoint.progress
    }

    activeJobs.set(job.id, { cancelled: false, paused: false })
    saveJob(job)

    try {
      fs.mkdirSync(job.destinationPath, { recursive: true })
      sendProgress(job.id, 0, 'Starting extraction...', 'extracting')
      await extractArchive(job, checkpoint)

      job.status = 'completed'
      job.progress = 100
      job.updatedAt = new Date().toISOString()
      saveJob(job)
      deleteCheckpoint(job.id)

      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('installer:complete', { jobId: job.id, name: job.name })
      })

      return { success: true, job }
    } catch (error: any) {
      if (error.message === 'CANCELLED') {
        job.status = 'failed'
        job.error = 'Cancelled by user'
      } else {
        job.status = 'failed'
        job.error = error.message
        job.updatedAt = new Date().toISOString()
        saveJob(job)

        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send('installer:error', {
            jobId: job.id,
            name: job.name,
            error: error.message,
          })
        })
      }
      return { success: false, error: error.message, job }
    }
  })

  ipcMain.handle('installer:detectExtractor', async () => {
    const extractor = findExtractor()
    return extractor || { type: 'none', path: '' }
  })

  ipcMain.handle('installer:pause', async (_event: any, jobId: string) => {
    const control = activeJobs.get(jobId)
    if (control) control.paused = true
    return { success: true }
  })

  ipcMain.handle('installer:resume', async (_event: any, jobId: string) => {
    const control = activeJobs.get(jobId)
    if (control) control.paused = false
    return { success: true }
  })

  ipcMain.handle('installer:cancel', async (_event: any, jobId: string) => {
    const control = activeJobs.get(jobId)
    if (control) control.cancelled = true
    return { success: true }
  })

  ipcMain.handle('installer:getCheckpoint', async (_event: any, jobId: string) => {
    return loadCheckpoint(jobId)
  })

  ipcMain.handle('installer:getAllJobs', async () => {
    return getAllJobs()
  })
}
