import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import os from 'os'

const TOGETHER_DIR = path.join(os.homedir(), '.faizlaunch', 'together')
const FRIENDS_FILE = path.join(TOGETHER_DIR, 'friends.json')
const PROFILE_FILE = path.join(TOGETHER_DIR, 'profile.json')

fs.mkdirSync(TOGETHER_DIR, { recursive: true })

interface Friend {
  id: string
  name: string
  avatar: string
  status: 'online' | 'offline' | 'gaming'
  currentGame?: string
  addedAt: string
}

interface Profile {
  id: string
  name: string
  avatar: string
  status: 'online' | 'offline' | 'gaming'
  currentGame?: string
}

function loadFriends(): Friend[] {
  if (fs.existsSync(FRIENDS_FILE)) {
    return JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf-8'))
  }
  return []
}

function saveFriends(friends: Friend[]) {
  fs.writeFileSync(FRIENDS_FILE, JSON.stringify(friends, null, 2))
}

function loadProfile(): Profile {
  if (fs.existsSync(PROFILE_FILE)) {
    return JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf-8'))
  }
  return {
    id: `user_${Date.now()}`,
    name: 'Gamer',
    avatar: '🎮',
    status: 'online',
  }
}

function saveProfile(profile: Profile) {
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2))
}

export function registerTogetherHandlers() {
  ipcMain.handle('together:getProfile', async () => loadProfile())

  ipcMain.handle('together:saveProfile', async (_event, profile: Profile) => {
    saveProfile(profile)
    return { success: true }
  })

  ipcMain.handle('together:getFriends', async () => loadFriends())

  ipcMain.handle('together:addFriend', async (_event, name: string) => {
    const friends = loadFriends()
    const avatars = ['🎮', '🔥', '⚡', '🚀', '💀', '🎯', '🏆', '👾', '🤖', '🦊']
    const statuses: Array<'online' | 'offline' | 'gaming'> = ['online', 'offline', 'gaming']
    const games = ['Cyberpunk 2077', 'GTA V', 'RDR2', 'Elden Ring', 'Witcher 3', null]

    const friend: Friend = {
      id: `friend_${Date.now()}`,
      name,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      currentGame: games[Math.floor(Math.random() * games.length)] || undefined,
      addedAt: new Date().toISOString(),
    }

    friends.push(friend)
    saveFriends(friends)
    return { success: true, friend }
  })

  ipcMain.handle('together:removeFriend', async (_event, friendId: string) => {
    const friends = loadFriends().filter(f => f.id !== friendId)
    saveFriends(friends)
    return { success: true }
  })

  ipcMain.handle('together:updateStatus', async (_event, status: string, game?: string) => {
    const profile = loadProfile()
    profile.status = status as any
    profile.currentGame = game
    saveProfile(profile)
    return { success: true }
  })
}