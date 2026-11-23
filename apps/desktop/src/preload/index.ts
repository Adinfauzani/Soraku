import { proxy } from 'abslink'
import { wrap } from 'abslink/electron'
import { wrap as wrapPort } from 'abslink/w3c'
import { contextBridge, ipcRenderer } from 'electron'

import type IPC from '../main/ipc.ts'
import type { Remote } from 'abslink'
import type { FileInfo, LibraryEntry, Native, PeerInfo, TorrentFile, TorrentInfo } from '@soraku/native'
import type TorrentClient from '@soraku/torrent-client'

ipcRenderer.send('preload-done')

const version = ipcRenderer.invoke('version')

const torrent = new Promise<Remote<TorrentClient>>(resolve => {
  ipcRenderer.once('port', ({ ports }) => {
    if (!ports[0]) return
    ports[0].start()
    resolve(wrapPort<TorrentClient>(ports[0]) as unknown as Remote<TorrentClient>)
  })
})

const main = wrap<typeof IPC.prototype>(ipcRenderer)

const native: Native = {
  restart: () => main.restart(),
  openURL: (url: string) => main.openURL(url),
  share: async (data) => {
    if (!data) return
    await navigator.clipboard.writeText(data.url ?? data.text ?? data.title!)
  },
  minimise: () => main.minimise(),
  maximise: () => main.maximise(),
  focus: () => main.focus(),
  close: () => main.close(),
  setZoom: (scale: number) => main.setZoom(scale),
  openUIDevtools: () => ipcRenderer.invoke('open-devtools').catch(() => {}),
  setHideToTray: (enabled: boolean) => main.setHideToTray(enabled),
  setAngle: (angle: string) => main.setAngle(angle),
  enableCORS: (urls: string[]) => main.enableCORS(urls),
  checkAvailableSpace: async () => await (await torrent).checkAvailableSpace() as unknown as number,
  checkIncomingConnections: async (port) => await (await torrent).checkIncomingConnections(port),
  updatePeerCounts: async (hashes) => await (await torrent).scrape(hashes),
  addTorrent: async (id, mediaID, episode, background) => await (await torrent).playTorrent(id, mediaID, episode, '1', background) as unknown as TorrentFile[],
  deleteTorrents: async (hashes) => await (await torrent).deleteTorrents(hashes),
  rescanTorrents: async (hashes) => await (await torrent).rescanTorrents(hashes),
  library: async () => await (await torrent).library() as unknown as LibraryEntry[],
  torrentInfo: async (hash) => await (await torrent).torrentInfo(hash) as unknown as TorrentInfo,
  peerInfo: async (hash) => await (await torrent).peerInfo(hash) as unknown as PeerInfo[],
  fileInfo: async (hash) => await (await torrent).fileInfo(hash) as unknown as FileInfo[],
  trackers: async (hash) => await (await torrent).trackers(hash) as unknown as Record<string, { complete: number, downloaded: number, incomplete: number, failed: boolean }>,
  protocolStatus: async (hash) => await (await torrent).protocolStatus(hash) as unknown as { dht: boolean, pex: boolean, nat: boolean, forwarding: boolean, persisting: boolean, streaming: boolean },
  cachedTorrents: async () => await (await torrent).cached(),
  activeTorrents: async () => await (await torrent).activeTorrents() as unknown as TorrentInfo[],
  updateSettings: (settings) => main.updateSettings(settings),
  selectDownload: async () => (await main.selectDownload()) as string,
  setMediaSession: (metadata, mediaId) => main.setMediaSession(metadata, mediaId),
  setPositionState: (state, paused) => main.setPositionState(state, paused),
  setPlayBackState: (paused) => main.setPlayBackState(paused),
  downloadProgress: (percent) => main.setDownloadProgress(percent),
  subtitles: async (hash: string, id: number, cb: (subtitle: { text: string, time: number, duration: number }, trackNumber: number) => void) =>
    await (await torrent).attachments.subtitle(hash, id, proxy(cb)),
  errors: async (cb: (error: Error) => void) => { void cb; await main.getLogs() },
  navigate: async (cb) => {
    ipcRenderer.on('navigate', (_e, data) => cb(data))
  },
  updateAndRestart: () => main.restart(),
  updateReady: async () => {},
  checkUpdate: async () => {},
  updateProgress: async () => {},
  isApp: true,
  version: () => version
}

try {
  contextBridge.exposeInMainWorld('native', native)
} catch (error) {
  console.error(error)
}