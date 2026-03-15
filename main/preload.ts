import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('faizAPI', {
  // Window controls
  // Add inside contextBridge.exposeInMainWorld('faizAPI', { ... })
  aiChat: (message: string, hardware: any) => ipcRenderer.invoke('ai:chat', message, hardware),
  vaultGetAll: () => ipcRenderer.invoke('vault:getAll'),
  vaultBackup: (name: string, path: string) => ipcRenderer.invoke('vault:backup', name, path),
  vaultDelete: (id: string) => ipcRenderer.invoke('vault:delete', id),
  vaultRestore: (id: string, path: string) => ipcRenderer.invoke('vault:restore', id, path),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  togetherGetProfile: () => ipcRenderer.invoke('together:getProfile'),
  togetherSaveProfile: (profile: any) => ipcRenderer.invoke('together:saveProfile', profile),
  togetherGetFriends: () => ipcRenderer.invoke('together:getFriends'),
  togetherAddFriend: (name: string) => ipcRenderer.invoke('together:addFriend', name),
  togetherRemoveFriend: (id: string) => ipcRenderer.invoke('together:removeFriend', id),
  togetherUpdateStatus: (status: string, game?: string) => ipcRenderer.invoke('together:updateStatus', status, game),

  // Dialogs
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),

  // Hardware
  getHardwareInfo: () => ipcRenderer.invoke('hardware:getInfo'),
  checkRequirements: (requirements: any) => ipcRenderer.invoke('hardware:checkRequirements', requirements),

  // Installer
  startInstall: (job: any) => ipcRenderer.invoke('installer:start', job),
  pauseInstall: (jobId: string) => ipcRenderer.invoke('installer:pause', jobId),
  resumeInstall: (jobId: string) => ipcRenderer.invoke('installer:resume', jobId),
  cancelInstall: (jobId: string) => ipcRenderer.invoke('installer:cancel', jobId),
  getCheckpoint: (jobId: string) => ipcRenderer.invoke('installer:getCheckpoint', jobId),
  getAllJobs: () => ipcRenderer.invoke('installer:getAllJobs'),

  // Progress events
  onProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('installer:progress', (_event, data) => callback(data))
  },
  onInstallComplete: (callback: (data: any) => void) => {
    ipcRenderer.on('installer:complete', (_event, data) => callback(data))
  },
  onInstallError: (callback: (data: any) => void) => {
    ipcRenderer.on('installer:error', (_event, data) => callback(data))
  },

  // Error analyzer
  analyzeError: (errorText: string) => ipcRenderer.invoke('error:analyze', errorText),

  // Defender
  addExclusion: (path: string) => ipcRenderer.invoke('defender:addExclusion', path),
  removeExclusion: (path: string) => ipcRenderer.invoke('defender:removeExclusion', path),

  // Cleanup
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
})