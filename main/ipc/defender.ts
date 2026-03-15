import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import { DefenderAction } from '../../shared/types'

const execAsync = promisify(exec)

export function registerDefenderHandlers() {
  ipcMain.handle('defender:addExclusion', async (_event, folderPath: string): Promise<DefenderAction> => {
    if (process.platform !== 'win32') {
      return {
        type: 'exclude',
        path: folderPath,
        success: true,
        message: 'Not on Windows — skipped',
      }
    }

    try {
      const command = `powershell -Command "Add-MpPreference -ExclusionPath '${folderPath}'"`
      await execAsync(command)
      return {
        type: 'exclude',
        path: folderPath,
        success: true,
        message: `Successfully excluded ${folderPath} from Windows Defender`,
      }
    } catch (error) {
      // Try without admin — may still work
      try {
        const command = `powershell -Command "Add-MpPreference -ExclusionPath '${folderPath}'" -Verb RunAs`
        await execAsync(command)
        return {
          type: 'exclude',
          path: folderPath,
          success: true,
          message: `Excluded with elevated permissions`,
        }
      } catch {
        return {
          type: 'exclude',
          path: folderPath,
          success: false,
          message: `Could not add exclusion automatically. Please manually add ${folderPath} to Windows Defender exclusions.`,
        }
      }
    }
  })

  ipcMain.handle('defender:removeExclusion', async (_event, folderPath: string): Promise<DefenderAction> => {
    if (process.platform !== 'win32') {
      return {
        type: 'restore',
        path: folderPath,
        success: true,
        message: 'Not on Windows — skipped',
      }
    }

    try {
      const command = `powershell -Command "Remove-MpPreference -ExclusionPath '${folderPath}'"`
      await execAsync(command)
      return {
        type: 'restore',
        path: folderPath,
        success: true,
        message: `Removed exclusion for ${folderPath}`,
      }
    } catch (error) {
      return {
        type: 'restore',
        path: folderPath,
        success: false,
        message: `Could not remove exclusion automatically`,
      }
    }
  })
}