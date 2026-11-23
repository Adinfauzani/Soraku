import { join } from 'node:path'
import process from 'node:process'

import { expose } from 'abslink/electron'
import { electronApp, is } from '@electron-toolkit/utils'
import { BrowserWindow, Menu, MessageChannelMain, app, ipcMain, nativeImage, powerMonitor, session, Tray, utilityProcess } from 'electron'
import log from 'electron-log/main'

import ico from '../../build/icon.ico?asset'
import icon from '../../build/icon.png?asset'

import './util.ts'
import forkPath from './background/background.ts?modulePath'
import Protocol from './protocol.ts'
import IPC from './ipc.ts'
import store from './store.ts'
import { PRODUCTION_BASE_URL } from './embedded.ts'

import type { Messageable } from 'abslink'
import type { SessionMetadata } from '@soraku/native'

log.initialize({ spyRendererConsole: true, preload: false })
log.transports.file.level = 'debug'
log.transports.file.maxSize = 10 * 1024 * 1024

const BASE_URL = is.dev ? 'http://localhost:3000/' : PRODUCTION_BASE_URL

function setCors (record?: Record<string, string[]>) {
  if (!record) return
  if (record['access-control-allow-origin'] ?? record['Access-Control-Allow-Origin']) return
  record['access-control-allow-origin'] = ['*']
  record['access-control-allow-methods'] = ['GET, POST, PUT, DELETE, OPTIONS, PATCH']
  record['access-control-allow-headers'] = ['*']
}

const iconPng = nativeImage.createFromPath(icon)
const iconIco = nativeImage.createFromPath(ico)

export default class App {
  torrentProcess = utilityProcess.fork(forkPath, [], {
    stdio: ['ignore', 'pipe', 'pipe'],
    serviceName: 'Soraku Torrent Client'
  })

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 869,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    show: false,
    title: 'Soraku',
    backgroundColor: '#000000',
    icon: iconPng,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: true,
      enableBlinkFeatures: 'FluentOverlayScrollbars,FluentOverlayScrollbar',
      backgroundThrottling: true
    }
  })

  protocol = new Protocol(this.mainWindow)
  ipc = new IPC(this, this.torrentProcess)
  tray = new Tray(process.platform === 'win32' ? iconIco : iconPng)
  mediaSession: SessionMetadata | undefined

  constructor () {
    this.tray.setToolTip('Soraku')
    this.tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Soraku', enabled: false },
      { type: 'separator' },
      {
        label: 'Show App',
        click: () => {
          this.mainWindow.show()
          this.mainWindow.focus()
        }
      },
      { type: 'separator' },
      { label: 'Exit Soraku', click: () => this.destroy() }
    ]))
    this.tray.on('click', () => {
      this.mainWindow.show()
      this.mainWindow.focus()
    })

    this.mainWindow.setMenuBarVisibility(false)

    session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
      cb(permission === 'media' || permission === 'fullscreen')
    })

    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      callback({ cancel: false, requestHeaders: details.requestHeaders })
    })

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      // API and anime providers don't all send CORS headers. Native app doesn't need them.
      if (details.responseHeaders && !details.url.startsWith('https://accounts.google.com')) {
        setCors(details.responseHeaders)
      }
      callback(details)
    })

    this.torrentProcess.stdout?.on('data', d => console.log('[torrent]', '' + d))
    this.torrentProcess.stderr?.on('data', d => console.error('[torrent]', '' + d))

    powerMonitor.on('shutdown', () => this.destroy())
    process.on('SIGTERM', () => this.destroy())

    if (process.platform === 'win32') {
      process.on('message', (data) => {
        if (data === 'graceful-exit') this.destroy()
      })
    }

    this.mainWindow.once('ready-to-show', () => this.mainWindow.show())
    this.mainWindow.on('closed', () => this.destroy())
    this.torrentProcess.on('exit', () => this.destroy())
    ipcMain.on('close', () => this.destroy())
    app.on('before-quit', e => {
      if (this.destroyed) return
      e.preventDefault()
      this.destroy()
    })

    electronApp.setAppUserModelId('com.soraku.desktop')

    // expose IPC object over ipcMain: renderer calls via abslink wrap
    expose(this.ipc, ipcMain, this.mainWindow.webContents as Messageable)

    ipcMain.handle('open-devtools', () => {
      this.mainWindow.webContents.openDevTools({ mode: 'detach' })
    })

    const reloadPorts = () => {
      if (this.destroyed) return
      const { port1, port2 } = new MessageChannelMain()
      this.torrentProcess.postMessage({ id: 'settings', data: { ...store.data.torrentSettings, path: store.get('torrentPath') } }, [port1])
      this.mainWindow.webContents.postMessage('port', null, [port2])
    }

    const { port1, port2 } = new MessageChannelMain()
    this.torrentProcess.once('spawn', () => {
      this.torrentProcess.postMessage({ id: 'settings', data: { ...store.data.torrentSettings, path: store.get('torrentPath') } }, [port1])
    })
    ipcMain.once('preload-done', () => {
      this.mainWindow.webContents.postMessage('port', null, [port2])
      ipcMain.on('preload-done', () => reloadPorts())
    })

    app.on('second-instance', (_event, commandLine) => {
      if (this.destroyed) return
      this.mainWindow.show()
      if (this.mainWindow.isMinimized()) this.mainWindow.restore()
      this.mainWindow.focus()
      for (const line of commandLine) {
        this.protocol.handleProtocol(line)
      }
    })

    if (is.dev) this.mainWindow.webContents.openDevTools()
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https:\/\/[^/]*google\.com/.test(url) || /^https:\/\/[^/]*anilist\.co/.test(url)) {
        void this.ipc.openURL(url)
      }
      return { action: 'deny' }
    })

    const loadApp = (url: string): Promise<void> =>
      this.mainWindow.loadURL(url).catch((err) => {
        log.error('Failed to load web app:', err)
        if (is.dev && url !== PRODUCTION_BASE_URL) {
          log.warn('Dev server not reachable; falling back to embedded build.')
          return loadApp(PRODUCTION_BASE_URL)
        }
        log.error('Is apps/web running? Run `pnpm --filter @soraku/web dev` in the Soraku monorepo.')
      })

    loadApp(BASE_URL)

    const isEmbeddedUrl = (url: string): boolean =>
      url === BASE_URL || url.startsWith(BASE_URL) ||
      url === PRODUCTION_BASE_URL || url.startsWith(PRODUCTION_BASE_URL)

    this.mainWindow.webContents.on('will-navigate', (e, url) => {
      if (!isEmbeddedUrl(url)) {
        e.preventDefault()
      }
    })

    let crashcount = 0
    this.mainWindow.webContents.on('render-process-gone', (_e, { reason }) => {
      if (reason !== 'crashed') return
      if (++crashcount > 10) {
        app.quit()
      } else {
        app.relaunch()
        app.exit(0)
      }
    })
  }

  destroyed = false

  async destroy () {
    if (this.destroyed) return
    this.destroyed = true
    try { this.mainWindow.hide() } catch {}
    try {
      this.torrentProcess.postMessage({ id: 'destroy' })
      this.torrentProcess.kill()
    } catch {}
    app.quit()
  }
}