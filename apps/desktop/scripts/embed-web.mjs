#!/usr/bin/env node
/**
 * Build `apps/web` and copy its `dist/` into the desktop package as
 * `resources-web/dist` so the packaged app can serve the UI offline via the
 * `sorami://` scheme (see src/main/embedded.ts).
 */
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const webDir = join(__dirname, '../../../apps/web')
const outDir = join(__dirname, '../resources-web/dist')

if (!existsSync(join(webDir, 'package.json'))) {
  console.error('[embed-web] apps/web not found:', webDir)
  process.exit(1)
}

console.log('[embed-web] building apps/web …')
execSync('npm run build', { cwd: webDir, stdio: 'inherit', env: process.env })

mkdirSync(dirname(outDir), { recursive: true })
rmSync(outDir, { recursive: true, force: true })
cpSync(join(webDir, 'dist'), outDir, { recursive: true })

console.log(`[embed-web] copied dist → ${outDir}`)