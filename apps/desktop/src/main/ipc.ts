import { readFile } from 'node:fs/promises'
import os from 'node:os'
import { dirname } from 'node:path'

import { app, dialog, ipcMain, shell, type UtilityProcess } from 'electron'
import log from 'electron-log/main'

import store from './store'

import type App from './app'
import type { ClientSettings, SessionMetadata } from '@soraku/native'

const WHITELISTED_URLS = [
  'https://anilist.co/',
  'https://myanimelist.net/',
  'https://soraku.vercel.app',
  'https://sorakuapi.vercel.app',
  'https://github.com/soraku-studio'
]

export default class IPC {
  app: App
  torrentProcess: UtilityProcess
  hideToTray = false
  corsURLS: string[] = []

  constructor (window: App, torrentProcess: UtilityProcess) {
    this.app = window
    this.torrentProcess = torrentProcess
    ipcMain.handle('version', () => app.getVersion())
  }

  openURL (url: string) {
    const ok = WHITELISTED_URLS.some((u) => url.startsWith(u))
    if (ok) void shell.openExternal(url)
  }

  minimise () {
    this.app.mainWindow.minimize()
  }

  maximise () {
    this.app.mainWindow.isMaximized() ? this.app.mainWindow.unmaximize() : this.app.mainWindow.maximize()
  }

  close () {
    if (this.hideToTray) {
      this.app.mainWindow.hide()
    } else {
      this.app.destroy()
    }
  }

  setZoom (scale: number) {
    this.app.mainWindow.webContents.setZoomFactor(Math.min(2.5, Math.max(Number(scale) || 1, 0.3)))
  }

  setHideToTray (enabled: boolean) {
    this.hideToTray = enabled
  }

  restart () {
    app.relaunch()
    this.app.destroy()
  }

  setAngle (angle: string) {
    store.set('angle', angle)
    app.relaunch()
    this.app.destroy()
  }

  enableCORS (urls: string[]) {
    this.corsURLS = urls.filter(url => !WHITELISTED_URLS.some(whitelisted => url.startsWith(whitelisted)))
  }

  focus () {
    this.app.mainWindow.show()
    if (this.app.mainWindow.isMinimized()) this.app.mainWindow.restore()
    this.app.mainWindow.focus()
  }

  updateSettings (settings: ClientSettings = store.data.torrentSettings) {
    store.set('torrentSettings', settings)
    this.torrentProcess.postMessage({ id: 'settings', data: { ...settings, path: store.get('torrentPath') } })
  }

  async selectDownload () {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Select torrent download location',
      properties: ['openDirectory']
    })
    if (canceled || !filePaths.length) return store.get('torrentPath')

    let selected = filePaths[0]!
    if (dirname(selected) === selected) throw new Error('Cannot select root directory as download location.')
    if (!selected.endsWith('\\') && !selected.endsWith('/')) {
      selected += selected.includes('\\') ? '\\' : '/'
    }
    store.set('torrentPath', selected)
    this.updateSettings()
    return selected
  }

  async getLogs () {
    return await readFile(log.transports.file.getFile().path, 'utf8')
  }

  async getDeviceInfo () {
    const { model, speed } = os.cpus()[0]!
    return {
      features: app.getGPUFeatureStatus(),
      info: await app.getGPUInfo('complete'),
      cpu: { model, speed },
      ram: os.totalmem()
    }
  }

  setMediaSession (metadata: SessionMetadata, _mediaId?: number) {
    this.app.mediaSession = metadata
  }

  setPositionState (_state?: { duration?: number, playbackRate?: number, position?: number }, _paused?: 'none' | 'paused' | 'playing') {}

  setPlayBackState (_paused: 'none' | 'paused' | 'playing') {}

  setDownloadProgress (percent: number) {
    this.app.mainWindow.setProgressBar((percent === 1 || percent === 0) ? -1 : percent)
  }

  // torrent methods are proxied to the utility process via the port message channel,
  // the renderer talks to the utility process proxy over MessagePort directly.
}