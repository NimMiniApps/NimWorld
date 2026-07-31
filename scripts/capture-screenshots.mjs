import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const outDir = join(process.cwd(), 'docs/screenshots')
mkdirSync(outDir, { recursive: true })
const url = process.env.NIMWORLD_URL || 'http://localhost:5175/'

const sizes = [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1440, 900],
  [2560, 1080],
]

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('google-chrome', args, { stdio: 'inherit' })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`chrome ${code}`))))
  })
}

for (const [w, h] of sizes) {
  const file = join(outDir, `${w}x${h}.png`)
  // Use a data URL wrapper? Chrome headless screenshot of SPA needs time.
  // Run twice: first navigate via remote debugging is heavy; use long virtual time.
  await run([
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--run-all-compositor-stages-before-draw',
    `--window-size=${w},${h}`,
    `--screenshot=${file}`,
    '--virtual-time-budget=20000',
    `${url}?t=${Date.now()}`,
  ])
  console.log('saved', file)
}
