import { ipcMain } from 'electron'
import si from 'systeminformation'
import { HardwareInfo, HardwareWarning } from '../../shared/types'

export function registerHardwareHandlers() {
  ipcMain.handle('hardware:getInfo', async (): Promise<HardwareInfo> => {
    try {
      const [cpu, mem, graphics, disk, osInfo] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.graphics(),
        si.diskLayout(),
        si.osInfo(),
      ])

      const primaryGPU = graphics.controllers[0]
      const primaryDisk = disk[0]

      let diskType: 'SSD' | 'HDD' | 'Unknown' = 'Unknown'
      if (primaryDisk?.type === 'SSD') diskType = 'SSD'
      else if (primaryDisk?.type === 'HD') diskType = 'HDD'

      const fsSize = await si.fsSize()
      const primaryFS = fsSize[0]

      return {
        cpu: `${cpu.manufacturer} ${cpu.brand}`,
        ram: Math.round(mem.total / 1024 / 1024 / 1024),
        freeRam: Math.round(mem.available / 1024 / 1024 / 1024),
        gpu: primaryGPU ? `${primaryGPU.vendor} ${primaryGPU.model}` : 'Unknown',
        totalDisk: Math.round((primaryFS?.size || 0) / 1024 / 1024 / 1024),
        freeDisk: Math.round((primaryFS?.available || 0) / 1024 / 1024 / 1024),
        diskType,
        os: `${osInfo.distro} ${osInfo.release}`,
      }
    } catch (error) {
      throw new Error(`Hardware detection failed: ${error}`)
    }
  })

  ipcMain.handle('hardware:checkRequirements', async (_event, requirements: {
    minRam?: number
    minDisk?: number
    estimatedInstallTime?: boolean
  }): Promise<HardwareWarning[]> => {
    const warnings: HardwareWarning[] = []

    try {
      const [mem, fsSize, disk] = await Promise.all([
        si.mem(),
        si.fsSize(),
        si.diskLayout(),
      ])

      const freeRamGB = mem.available / 1024 / 1024 / 1024
      const freeDiskGB = (fsSize[0]?.available || 0) / 1024 / 1024 / 1024
      const diskType = disk[0]?.type === 'HD' ? 'HDD' : 'SSD'

      // RAM check
      if (requirements.minRam && freeRamGB < requirements.minRam) {
        warnings.push({
          type: 'RAM',
          message: `You have ${freeRamGB.toFixed(1)}GB free RAM. This game needs ${requirements.minRam}GB. Close other apps before installing.`,
          severity: freeRamGB < requirements.minRam / 2 ? 'high' : 'medium',
        })
      }

      // Disk check
      if (requirements.minDisk && freeDiskGB < requirements.minDisk) {
        warnings.push({
          type: 'DISK',
          message: `You need ${requirements.minDisk}GB free space. You only have ${freeDiskGB.toFixed(1)}GB. Free up space first.`,
          severity: 'high',
        })
      }

      // HDD warning
      if (diskType === 'HDD' && requirements.estimatedInstallTime) {
        warnings.push({
          type: 'DISK',
          message: `You are using an HDD. Installation will take significantly longer than on an SSD. Do not turn off your PC during installation.`,
          severity: 'low',
        })
      }

      // Low RAM warning
      if (freeRamGB < 2) {
        warnings.push({
          type: 'RAM',
          message: `Critical: Only ${freeRamGB.toFixed(1)}GB RAM free. Installation may fail. Close ALL other applications now.`,
          severity: 'high',
        })
      }

      return warnings
    } catch (error) {
      return warnings
    }
  })
}