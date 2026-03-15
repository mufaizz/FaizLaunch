export const mockAPI = {
  minimize: () => { },
  maximize: () => { },
  close: () => { },
  openFolder: async () => '/games/test',
  openFile: async () => '/downloads/game.rar',
  getHardwareInfo: async () => ({
    cpu: 'Intel Core i5-10400',
    ram: 8,
    freeRam: 4,
    gpu: 'NVIDIA GTX 1060',
    totalDisk: 500,
    freeDisk: 120,
    diskType: 'HDD',
    os: 'Windows 10',
  }),
  checkRequirements: async () => ([
    { type: 'DISK', message: 'HDD detected. Installation will take longer than SSD.', severity: 'low' }
  ]),
  startInstall: async (job: any) => {
    let progress = 0
    const files = [
      'Extracting: setup.exe',
      'Extracting: data/textures.pak',
      'Extracting: data/audio.pak',
      'Extracting: binaries/game.exe',
      'Extracting: redist/vcredist.exe',
      'Installing: Visual C++ Runtime',
      'Installing: DirectX',
      'Writing game files...',
      'Finalizing installation...',
    ]
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 3
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        window.dispatchEvent(new CustomEvent('faiz:complete', { detail: { jobId: job.id, name: job.name } }))
        return
      }
      const file = files[Math.floor((progress / 100) * files.length)]
      window.dispatchEvent(new CustomEvent('faiz:progress', {
        detail: { jobId: job.id, progress, currentFile: file, status: 'extracting' }
      }))
    }, 400)
    return { success: true, job }
  },
  pauseInstall: async () => ({ success: true }),
  resumeInstall: async () => ({ success: true }),
  cancelInstall: async () => ({ success: true }),
  getCheckpoint: async () => null,
  getAllJobs: async () => [],
  onProgress: (cb: any) => {
    window.addEventListener('faiz:progress', (e: any) => cb(e.detail))
  },
  onInstallComplete: (cb: any) => {
    window.addEventListener('faiz:complete', (e: any) => cb(e.detail))
  },
  onInstallError: (cb: any) => {
    window.addEventListener('faiz:error', (e: any) => cb(e.detail))
  },
  analyzeError: async (text: string) => ([{
    errorType: 'DLL Missing',
    detected: 'vcruntime140.dll',
    explanation: 'Visual C++ Runtime is missing.',
    fixSteps: [
      'Download Visual C++ Redistributable 2015-2022',
      'Run as Administrator',
      'Restart PC',
      'Try launching the game again',
    ],
    downloadLink: 'https://aka.ms/vs/17/release/vc_redist.x64.exe',
    severity: 'high',
  }]),
  addExclusion: async () => ({ success: true }),
  removeExclusion: async () => ({ success: true }),
  removeAllListeners: () => { },

  // AI Companion
  aiChat: async (message: string, hardware: any) => {
    const lower = message.toLowerCase()
    if (lower.includes('isdone') || lower.includes('unarc')) {
      return { response: `🩺 ISDone.dll / Unarc.dll Error — Most common FitGirl error.\n\nCause: Not enough virtual memory during extraction.\n\nFix:\n1. Right-click This PC → Properties → Advanced System Settings\n2. Performance → Settings → Advanced → Virtual Memory\n3. Set custom size: Initial = 10000 MB, Maximum = 20000 MB\n4. Restart PC and try again\n\nIf still failing: your download is corrupted. Re-download.`, source: 'local' }
    }
    if (lower.includes('vcruntime') || lower.includes('dll')) {
      return { response: `🩺 Missing DLL detected.\n\nFix:\n1. Download Visual C++ Redistributable 2015-2022\n   https://aka.ms/vs/17/release/vc_redist.x64.exe\n2. Run as Administrator\n3. Restart PC\n4. Launch the game again`, source: 'local' }
    }
    if (lower.includes('stuck') || lower.includes('0%') || lower.includes('slow')) {
      return { response: `💡 Install appears stuck.\n\nHDD installs can look frozen for 30-60 minutes while extracting large files.\n\nCheck:\n1. Is your HDD light blinking? If yes — it's working\n2. Task Manager → is 7z.exe or setup.exe using disk?\n3. Do NOT cancel — FaizLaunch will resume if it fails\n\nExpected time on HDD: 8-15 hours for large games.`, source: 'local' }
    }
    if (lower.includes('defender') || lower.includes('deleted') || lower.includes('quarantine')) {
      return { response: `🩺 Windows Defender deleted a game file.\n\nFix:\n1. Windows Security → Virus & threat protection → Protection history\n2. Find quarantined file → Restore\n3. Add game folder to exclusions:\n   PowerShell (Admin): Add-MpPreference -ExclusionPath "C:\\Games\\YourGame"\n\nFaizLaunch does this automatically on future installs.`, source: 'local' }
    }
    return {
      response: `I heard you. Here are general steps that fix 90% of install problems:\n\n1. Run installer as Administrator\n2. Disable Windows Defender temporarily\n3. Close all other apps (free up RAM)\n4. Make sure you have enough disk space (2-3x game size)\n5. Verify your download is complete\n\nPaste your exact error message and I'll give you a specific fix.`,
      source: 'fallback'
    }
  },

  // Vault
  vaultGetAll: async () => [],
  vaultBackup: async (name: string, path: string) => ({
    success: true,
    entry: {
      id: `vault_${Date.now()}`,
      gameName: name,
      sourcePath: path,
      backupPath: `~/.faizlaunch/vault/mock`,
      size: 1024 * 1024 * 1024 * 12,
      createdAt: new Date().toISOString(),
      checksum: 'mock',
    }
  }),
  // Together
  togetherGetProfile: async () => ({
    id: 'me',
    name: 'Mufaiz',
    avatar: '⚡',
    status: 'online',
    currentGame: undefined,
  }),
  togetherSaveProfile: async (profile: any) => ({ success: true }),
  togetherGetFriends: async () => ([
    { id: '1', name: 'Ahmed', avatar: '🔥', status: 'gaming', currentGame: 'GTA V', addedAt: new Date().toISOString() },
    { id: '2', name: 'Zaid', avatar: '🚀', status: 'online', currentGame: undefined, addedAt: new Date().toISOString() },
    { id: '3', name: 'Raza', avatar: '💀', status: 'offline', currentGame: undefined, addedAt: new Date().toISOString() },
    { id: '4', name: 'Bilal', avatar: '🎯', status: 'gaming', currentGame: 'Elden Ring', addedAt: new Date().toISOString() },
  ]),
  togetherAddFriend: async (name: string) => ({
    success: true,
    friend: {
      id: `friend_${Date.now()}`,
      name,
      avatar: '🎮',
      status: 'online',
      currentGame: undefined,
      addedAt: new Date().toISOString(),
    }
  }),
  togetherRemoveFriend: async (id: string) => ({ success: true }),
  vaultDelete: async (id: string) => ({ success: true }),
  vaultRestore: async (id: string, path: string) => ({ success: true }),
}