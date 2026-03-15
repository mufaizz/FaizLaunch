import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import os from 'os'
import si from 'systeminformation'

interface HealthIssue {
  id: string
  type: 'warning' | 'critical' | 'info'
  category: 'storage' | 'memory' | 'temperature' | 'files' | 'drivers'
  title: string
  description: string
  fix: string
  autoFixable: boolean
}

export function registerDoctorHandlers() {
  ipcMain.handle('doctor:scan', async () => {
    const issues: HealthIssue[] = []

    try {
      const [mem, fsSize, disk] = await Promise.all([
        si.mem(),
        si.fsSize(),
        si.diskLayout(),
      ])

      const freeRamGB = mem.available / 1024 / 1024 / 1024
      const totalRamGB = mem.total / 1024 / 1024 / 1024
      const freeDiskGB = (fsSize[0]?.available || 0) / 1024 / 1024 / 1024
      const totalDiskGB = (fsSize[0]?.size || 0) / 1024 / 1024 / 1024
      const diskUsedPct = ((totalDiskGB - freeDiskGB) / totalDiskGB) * 100

      // RAM check
      if (freeRamGB < 2) {
        issues.push({
          id: 'low_ram',
          type: 'critical',
          category: 'memory',
          title: 'Critical: Very Low RAM',
          description: `Only ${freeRamGB.toFixed(1)}GB RAM free. Installs will likely fail.`,
          fix: 'Close all background apps before installing. Consider upgrading RAM.',
          autoFixable: false,
        })
      } else if (freeRamGB < 4) {
        issues.push({
          id: 'warn_ram',
          type: 'warning',
          category: 'memory',
          title: 'Low Available RAM',
          description: `${freeRamGB.toFixed(1)}GB free. Some large game installs may struggle.`,
          fix: 'Close Chrome, Discord, and other apps before installing.',
          autoFixable: false,
        })
      }

      // Disk space check
      if (freeDiskGB < 10) {
        issues.push({
          id: 'critical_disk',
          type: 'critical',
          category: 'storage',
          title: 'Critical: Almost No Disk Space',
          description: `Only ${freeDiskGB.toFixed(1)}GB free. Cannot install most games.`,
          fix: 'Free up space immediately. Delete old games, empty Recycle Bin, run Disk Cleanup.',
          autoFixable: false,
        })
      } else if (diskUsedPct > 85) {
        issues.push({
          id: 'warn_disk',
          type: 'warning',
          category: 'storage',
          title: 'Disk Almost Full',
          description: `${diskUsedPct.toFixed(0)}% of disk used. Large installs may fail mid-way.`,
          fix: 'Free up at least 20GB before installing large games.',
          autoFixable: false,
        })
      }

      // HDD warning
      if (disk[0]?.type === 'HD') {
        issues.push({
          id: 'hdd_detected',
          type: 'info',
          category: 'storage',
          title: 'HDD Detected',
          description: 'You are using a Hard Disk Drive. Game installs will take 8-15 hours.',
          fix: 'FaizLaunch checkpoint system protects your installs. Do not interrupt the process.',
          autoFixable: false,
        })
      }

      // Virtual memory check
      const pageSize = mem.swaptotal
      if (pageSize < 8 * 1024 * 1024 * 1024) {
        issues.push({
          id: 'low_pagefile',
          type: 'warning',
          category: 'memory',
          title: 'Low Virtual Memory (Pagefile)',
          description: 'Virtual memory is too low. ISDone.dll errors likely during large game extraction.',
          fix: 'Set pagefile to minimum 10000MB. This prevents the most common FitGirl install error.',
          autoFixable: false,
        })
      }

      // Check FaizLaunch directories
      const faizDir = path.join(os.homedir(), '.faizlaunch')
      if (!fs.existsSync(faizDir)) {
        issues.push({
          id: 'missing_dir',
          type: 'warning',
          category: 'files',
          title: 'FaizLaunch Data Missing',
          description: 'FaizLaunch data directory not found.',
          fix: 'This will be created automatically on first install.',
          autoFixable: true,
        })
      }

      // Check for orphaned checkpoints
      const checkpointDir = path.join(faizDir, 'checkpoints')
      if (fs.existsSync(checkpointDir)) {
        const checkpoints = fs.readdirSync(checkpointDir)
        if (checkpoints.length > 0) {
          issues.push({
            id: 'orphaned_checkpoints',
            type: 'info',
            category: 'files',
            title: `${checkpoints.length} Incomplete Install(s) Found`,
            description: `Found ${checkpoints.length} paused or failed installation(s) that can be resumed.`,
            fix: 'Go to Install tab and resume, or clear them if no longer needed.',
            autoFixable: true,
          })
        }
      }

      if (issues.length === 0) {
        issues.push({
          id: 'all_good',
          type: 'info',
          category: 'files',
          title: 'All Systems Healthy',
          description: 'No issues detected. Your PC is ready for gaming.',
          fix: '',
          autoFixable: false,
        })
      }

    } catch (error) {
      issues.push({
        id: 'scan_error',
        type: 'info',
        category: 'files',
        title: 'Partial Scan Complete',
        description: 'Some hardware info could not be read.',
        fix: 'This is normal on some systems.',
        autoFixable: false,
      })
    }

    return issues
  })

  ipcMain.handle('doctor:autofix', async (_event, issueId: string) => {
    const faizDir = path.join(os.homedir(), '.faizlaunch')

    if (issueId === 'missing_dir') {
      fs.mkdirSync(path.join(faizDir, 'checkpoints'), { recursive: true })
      fs.mkdirSync(path.join(faizDir, 'vault'), { recursive: true })
      fs.mkdirSync(path.join(faizDir, 'logs'), { recursive: true })
      return { success: true, message: 'Created FaizLaunch directories' }
    }

    if (issueId === 'orphaned_checkpoints') {
      const checkpointDir = path.join(faizDir, 'checkpoints')
      fs.readdirSync(checkpointDir).forEach(f => {
        fs.unlinkSync(path.join(checkpointDir, f))
      })
      return { success: true, message: 'Cleared incomplete installations' }
    }

    return { success: false, message: 'Cannot auto-fix this issue' }
  })
}