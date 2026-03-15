import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const KNOWLEDGE_BASE = [
  {
    keywords: ['isdone', 'unarc', '12', '11'],
    response: `🩺 This is the most common FitGirl error — ISDone.dll / Unarc.dll.

The cause: Your PC ran out of virtual memory (RAM + pagefile) during extraction.

Fix it in 3 steps:
1. Right-click This PC → Properties → Advanced System Settings
2. Performance → Settings → Advanced → Virtual Memory → Change
3. Set custom size: Initial = 10000 MB, Maximum = 20000 MB
4. Click OK, restart PC, try again

If it still fails after this: your download is corrupted. Re-download the game.`,
  },
  {
    keywords: ['vcruntime140', 'msvcp140', 'vcredist', 'visual c'],
    response: `🩺 Missing Visual C++ Runtime detected.

This DLL is required by almost every modern game.

Fix:
1. Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
2. Run as Administrator
3. Restart your PC
4. Launch the game again

Install BOTH x64 and x86 versions if you're unsure.`,
  },
  {
    keywords: ['steam_api', 'steam api', 'crack', 'defender', 'deleted', 'quarantine'],
    response: `🩺 Windows Defender deleted a critical game file.

This usually affects crack/bypass files like steam_api64.dll.

Fix:
1. Open Windows Security → Virus & threat protection
2. Click Protection history
3. Find the quarantined file and click Restore
4. Then add your game folder to Defender exclusions:
   PowerShell (Admin): Add-MpPreference -ExclusionPath "C:\\Games\\YourGame"

FaizLaunch does this automatically — make sure you used our installer.`,
  },
  {
    keywords: ['directx', 'd3dx9', 'xinput', 'xaudio'],
    response: `🩺 Missing DirectX component detected.

Fix:
1. Download DirectX End-User Runtime Web Installer
   https://www.microsoft.com/en-us/download/details.aspx?id=35
2. Run the installer — it will detect and install only what's missing
3. Restart PC
4. Launch the game

This is different from the DirectX that comes with Windows — you need the legacy runtime.`,
  },
  {
    keywords: ['not enough space', 'disk space', 'no space', 'insufficient'],
    response: `🩺 Not enough disk space.

FitGirl repacks need 2-3x the final game size during extraction.

Fix:
1. Check how much space the game needs (listed on FitGirl's page)
2. Free up space: run Disk Cleanup, empty Recycle Bin, delete old files
3. Or install to a different drive with more space
4. Make sure you have at least 20% more than the stated game size`,
  },
  {
    keywords: ['slow', 'hdd', 'hours', 'stuck', '0%', 'not moving', 'frozen'],
    response: `💡 Your install looks stuck but it's probably not.

HDD installs can appear frozen for 30-60 minutes while extracting large files.

What to do:
1. Check if your HDD light is blinking — if yes, it's working
2. Open Task Manager → check if setup.exe or 7z.exe is using CPU/disk
3. Do NOT cancel — restarting means starting over
4. FaizLaunch checkpoint system will resume if it actually fails

Estimated time on HDD: 8-15 hours for large games. On SSD: 30-60 mins.`,
  },
  {
    keywords: ['access denied', 'permission', 'administrator', 'admin'],
    response: `🩺 Permission / Access Denied error.

Fix:
1. Right-click the installer → Run as Administrator
2. Don't install to C:\\Program Files — use C:\\Games instead
3. Check the destination folder isn't set to Read-Only:
   Right-click folder → Properties → uncheck Read-only
4. Temporarily disable antivirus during installation`,
  },
  {
    keywords: ['openal', 'oal'],
    response: `🩺 Missing OpenAL audio library.

Fix:
1. Download OpenAL: https://www.openal.org/downloads/
2. Install it
3. Restart the game`,
  },
  {
    keywords: ['.net', 'dotnet', 'net framework', 'net runtime'],
    response: `🩺 Missing .NET Runtime.

Fix:
1. Download .NET Runtime: https://dotnet.microsoft.com/en-us/download
2. Install the version the game requires (usually shown in the error)
3. Restart PC`,
  },
  {
    keywords: ['corrupt', 'corrupted', 'crc', 'checksum', 'bad archive'],
    response: `🩺 Corrupted download detected.

This means one or more parts of your download are damaged.

Fix:
1. Delete ALL downloaded parts (.part1.rar, .part2.rar, etc.)
2. Re-download from the original source
3. Make sure all parts are fully downloaded before starting extraction
4. If using a download manager, verify all parts completed fully`,
  },
]

function analyzeWithKnowledge(message: string): string | null {
  const lower = message.toLowerCase()
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return entry.response
    }
  }
  return null
}

export function registerAICompanionHandlers() {
  ipcMain.handle('ai:chat', async (_event, message: string, hardwareInfo: any) => {
    // First check local knowledge base
    const localAnswer = analyzeWithKnowledge(message)
    if (localAnswer) {
      return { response: localAnswer, source: 'local' }
    }

    // Check if Ollama is running
    try {
      await execAsync('curl -s http://localhost:11434/api/tags')
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt: `You are FaizAI, a gaming assistant built into FaizLaunch. You help gamers fix installation errors, optimize their PC, and solve gaming problems. Be concise and direct.

User PC: ${JSON.stringify(hardwareInfo)}

User question: ${message}

Give a helpful, specific answer focused on solving their gaming problem.`,
          stream: false,
        }),
      })
      const data = await response.json() as any
      return { response: data.response, source: 'ollama' }
    } catch {
      // Ollama not available — use smart fallback
      return {
        response: `I don't have a specific answer for that in my database yet.

Here are general troubleshooting steps:
1. Run the installer as Administrator
2. Temporarily disable Windows Defender and antivirus
3. Make sure you have enough free RAM (close other apps)
4. Check you have enough disk space (2-3x the game size)
5. Verify your download is complete and not corrupted

If you're seeing a specific error message, paste it here and I'll diagnose it.`,
        source: 'fallback',
      }
    }
  })
}