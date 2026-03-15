import { ipcMain } from 'electron'
import { ErrorDiagnosis } from '../../shared/types'

const ERROR_DATABASE: Record<string, ErrorDiagnosis> = {
  'vcruntime140.dll': {
    errorType: 'DLL Missing',
    detected: 'vcruntime140.dll',
    explanation: 'Visual C++ Runtime is missing. This is needed by almost every modern game.',
    fixSteps: [
      'Download Visual C++ Redistributable 2015-2022',
      'Run the installer as Administrator',
      'Restart your PC',
      'Try launching the game again',
    ],
    downloadLink: 'https://aka.ms/vs/17/release/vc_redist.x64.exe',
    severity: 'high',
  },
  'msvcp140.dll': {
    errorType: 'DLL Missing',
    detected: 'msvcp140.dll',
    explanation: 'Visual C++ Runtime is missing.',
    fixSteps: [
      'Download Visual C++ Redistributable 2015-2022',
      'Run as Administrator',
      'Restart PC',
    ],
    downloadLink: 'https://aka.ms/vs/17/release/vc_redist.x64.exe',
    severity: 'high',
  },
  'xinput1_3.dll': {
    errorType: 'DirectX Missing',
    detected: 'xinput1_3.dll',
    explanation: 'DirectX Runtime is missing or outdated.',
    fixSteps: [
      'Download DirectX End-User Runtime Web Installer',
      'Run the installer',
      'Restart your PC',
    ],
    downloadLink: 'https://www.microsoft.com/en-us/download/details.aspx?id=35',
    severity: 'high',
  },
  'd3dx9': {
    errorType: 'DirectX Missing',
    detected: 'DirectX component',
    explanation: 'A DirectX component is missing from your system.',
    fixSteps: [
      'Download DirectX End-User Runtime',
      'Run installer as Administrator',
      'Restart PC',
    ],
    downloadLink: 'https://www.microsoft.com/en-us/download/details.aspx?id=35',
    severity: 'high',
  },
  'isdone.dll': {
    errorType: 'Extraction Error',
    detected: 'isdone.dll / unarc.dll',
    explanation: 'Your PC ran out of RAM or virtual memory during extraction. This is the most common FitGirl install error.',
    fixSteps: [
      'Close ALL other applications',
      'Right-click This PC → Properties → Advanced System Settings',
      'Click Performance → Settings → Advanced → Virtual Memory',
      'Set custom size: Initial 10000MB, Maximum 20000MB',
      'Click OK, restart PC, try again',
    ],
    severity: 'critical',
  },
  'unarc.dll': {
    errorType: 'Extraction Error',
    detected: 'unarc.dll',
    explanation: 'Archive extraction failed. Either corrupted download or not enough virtual memory.',
    fixSteps: [
      'First try: increase virtual memory (pagefile) to 10GB+',
      'If still failing: your download is corrupted, re-download',
      'Check that you have enough disk space for extraction',
    ],
    severity: 'critical',
  },
  'steam_api64.dll': {
    errorType: 'Crack File Missing',
    detected: 'steam_api64.dll',
    explanation: 'The Steam emulation file is missing or was deleted by Windows Defender.',
    fixSteps: [
      'Check if Windows Defender quarantined the file',
      'Open Windows Security → Virus & threat protection → Protection history',
      'Find and restore the quarantined file',
      'Add the game folder to Windows Defender exclusions',
    ],
    severity: 'high',
  },
  'openal32.dll': {
    errorType: 'DLL Missing',
    detected: 'openal32.dll',
    explanation: 'OpenAL audio library is missing.',
    fixSteps: [
      'Download OpenAL from the official site',
      'Install it',
      'Restart the game',
    ],
    downloadLink: 'https://www.openal.org/downloads/',
    severity: 'medium',
  },
  'msvcr120.dll': {
    errorType: 'DLL Missing',
    detected: 'msvcr120.dll',
    explanation: 'Visual C++ 2013 Runtime is missing.',
    fixSteps: [
      'Download Visual C++ Redistributable 2013',
      'Install both x64 and x86 versions',
      'Restart PC',
    ],
    downloadLink: 'https://support.microsoft.com/en-us/topic/update-for-visual-c-2013-d8a6297b',
    severity: 'high',
  },
  '.net': {
    errorType: 'Runtime Missing',
    detected: '.NET Runtime',
    explanation: '.NET Runtime is missing or outdated.',
    fixSteps: [
      'Download .NET Runtime from Microsoft',
      'Install the recommended version',
      'Restart PC',
    ],
    downloadLink: 'https://dotnet.microsoft.com/en-us/download',
    severity: 'high',
  },
  'not enough space': {
    errorType: 'Disk Space',
    detected: 'Insufficient disk space',
    explanation: 'Your drive does not have enough free space to complete installation.',
    fixSteps: [
      'Free up disk space by deleting unused files',
      'Empty the Recycle Bin',
      'Run Disk Cleanup',
      'Consider installing to a different drive',
    ],
    severity: 'high',
  },
  'access denied': {
    errorType: 'Permissions Error',
    detected: 'Access Denied',
    explanation: 'The installer does not have permission to write to this location.',
    fixSteps: [
      'Right-click the installer and select Run as Administrator',
      'If installing to Program Files, choose a different location like C:\\Games',
      'Check that the destination folder is not read-only',
    ],
    severity: 'medium',
  },
  'corrupt': {
    errorType: 'Corrupted Download',
    detected: 'Corrupted archive',
    explanation: 'One or more downloaded files are corrupted.',
    fixSteps: [
      'Delete all downloaded parts',
      'Re-download the game from the original source',
      'Make sure your download is complete before starting installation',
      'Check the MD5/SHA hash if provided by the source',
    ],
    severity: 'critical',
  },
}

export function registerErrorAnalyzerHandlers() {
  ipcMain.handle('error:analyze', async (_event, errorText: string): Promise<ErrorDiagnosis[]> => {
    const results: ErrorDiagnosis[] = []
    const errorLower = errorText.toLowerCase()

    for (const [key, diagnosis] of Object.entries(ERROR_DATABASE)) {
      if (errorLower.includes(key.toLowerCase())) {
        results.push(diagnosis)
      }
    }

    // Generic fallback
    if (results.length === 0) {
      results.push({
        errorType: 'Unknown Error',
        detected: 'Unrecognized error',
        explanation: 'FaizLaunch could not automatically identify this error. Copy the full error message and search it on the FitGirl Repacks forums or r/CrackSupport.',
        fixSteps: [
          'Copy the exact error message',
          'Search it on Google with the game name',
          'Check FitGirl Repacks comments for this game',
          'Try running the installer as Administrator',
          'Temporarily disable antivirus during installation',
        ],
        severity: 'medium',
      })
    }

    return results
  })
}