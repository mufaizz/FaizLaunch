export interface HardwareInfo {
  cpu: string
  ram: number
  freeRam: number
  gpu: string
  totalDisk: number
  freeDisk: number
  diskType: 'SSD' | 'HDD' | 'Unknown'
  os: string
}

export interface HardwareWarning {
  type: 'RAM' | 'DISK' | 'GPU' | 'CPU'
  message: string
  severity: 'low' | 'medium' | 'high'
}

export interface InstallJob {
  id: string
  name: string
  sourcePath: string
  destinationPath: string
  totalSize: number
  extractedSize: number
  status: 'pending' | 'downloading' | 'extracting' | 'installing' | 'completed' | 'failed' | 'paused'
  progress: number
  currentFile: string
  startedAt: string
  updatedAt: string
  error?: string
}

export interface Checkpoint {
  jobId: string
  progress: number
  extractedFiles: string[]
  lastFile: string
  timestamp: string
}

export interface ErrorDiagnosis {
  errorType: string
  detected: string
  explanation: string
  fixSteps: string[]
  downloadLink?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface DefenderAction {
  type: 'exclude' | 'restore'
  path: string
  success: boolean
  message: string
}

export interface GameLibraryEntry {
  id: string
  name: string
  installPath: string
  executablePath?: string
  coverImage?: string
  installedAt: string
  lastPlayed?: string
  playTime: number
  sizeOnDisk: number
  status: 'installed' | 'corrupted' | 'updating'
}