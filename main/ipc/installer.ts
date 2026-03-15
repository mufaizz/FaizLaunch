import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { InstallJob, Checkpoint } from '../../shared/types'

const CHECKPOINT_DIR = path.join(os.homedir(), '.faizlaunch', 'checkpoints')
const JOBS_FILE = path.join(os.homedir(), '.faizlaunch', 'jobs.json')

fs.mkdirSync(CHECKPOINT_DIR, { recursive: true })

const activeJobs = new Map<string, { cancelled: boolean; paused: boolean }>()

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
  if (index >= 0) {
    jobs[index] = job
  } else {
    jobs.push(job)
  }
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

async function extractArchive(job: InstallJob, checkpoint: Checkpoint | null) {
  const { spawn } = await import('child_process')

  return new Promise<void>((resolve, reject) => {
    const jobControl = activeJobs.get(job.id)

    // Try to use 7z if available
    const sevenZip = process.platform === 'win32' ? '7z' : '7za'

    const args = ['x', job.sourcePath, `-o${job.destinationPath}`, '-y', '-aoa']

    const proc = spawn(sevenZip, args, { stdio: ['ignore', 'pipe', 'pipe'] })

    let lastProgress = checkpoint?.progress || 0
    let fileCount = 0
    let currentFile = ''

    proc.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n')
      lines.forEach(line => {
        if (line.includes('%')) {
          const match = line.match(/(\d+)%/)
          if (match) {
            lastProgress = parseInt(match[1])
            sendProgress(job.id, lastProgress, currentFile, 'extracting')
          }
        }
        if (line.startsWith('Extracting')) {
          currentFile = line.replace('Extracting  ', '').trim()
          fileCount++

          // Save checkpoint every 50 files
          if (fileCount % 50 === 0) {
            saveCheckpoint({
              jobId: job.id,
              progress: lastProgress,
              extractedFiles: [],
              lastFile: currentFile,
              timestamp: new Date().toISOString(),
            })
          }

          // Check for pause/cancel
          const control = activeJobs.get(job.id)
          if (control?.cancelled) {
            proc.kill()
            reject(new Error('CANCELLED'))
            return
          }
        }
      })
    })

    proc.stderr.on('data', (data: Buffer) => {
      const error = data.toString()
      if (error.includes('ERROR')) {
        reject(new Error(error))
      }
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else if (code !== null) {
        reject(new Error(`Extraction failed with code ${code}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`7-Zip not found. Please install 7-Zip: https://www.7-zip.org/`))
    })
  })
}

export function registerInstallerHandlers() {
  ipcMain.handle('installer:start', async (_event, jobData: Partial<InstallJob>) => {
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
      job.status = 'extracting'
    }

    activeJobs.set(job.id, { cancelled: false, paused: false })
    saveJob(job)

    try {
      fs.mkdirSync(job.destinationPath, { recursive: true })

      sendProgress(job.id, job.progress, 'Starting...', 'extracting')

      await extractArchive(job, checkpoint)

      job.status = 'completed'
      job.progress = 100
      job.updatedAt = new Date().toISOString()
      saveJob(job)
      deleteCheckpoint(job.id)

      const windows = BrowserWindow.getAllWindows()
      windows.forEach(win => {
        win.webContents.send('installer:complete', { jobId: job.id, name: job.name })
      })

      return { success: true, job }
    } catch (error: any) {
      if (error.message === 'CANCELLED') {
        job.status = 'failed'
        job.error = 'Installation cancelled by user'
      } else {
        job.status = 'failed'
        job.error = error.message
        job.updatedAt = new Date().toISOString()
        saveJob(job)

        const windows = BrowserWindow.getAllWindows()
        windows.forEach(win => {
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

  ipcMain.handle('installer:pause', async (_event, jobId: string) => {
    const control = activeJobs.get(jobId)
    if (control) control.paused = true
    return { success: true }
  })

  ipcMain.handle('installer:resume', async (_event, jobId: string) => {
    const control = activeJobs.get(jobId)
    if (control) control.paused = false
    return { success: true }
  })

  ipcMain.handle('installer:cancel', async (_event, jobId: string) => {
    const control = activeJobs.get(jobId)
    if (control) control.cancelled = true
    return { success: true }
  })

  ipcMain.handle('installer:getCheckpoint', async (_event, jobId: string) => {
    return loadCheckpoint(jobId)
  })

  ipcMain.handle('installer:getAllJobs', async () => {
    return getAllJobs()
  })
}