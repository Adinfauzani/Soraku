export interface TorrentFile {
  name: string
  hash: string
  type: string
  size: number
  path: string
  url: string
  lan: string
  id: number
}

export interface TorrentInfo {
  name: string
  progress: number
  size: {
    total: number
    downloaded: number
    uploaded: number
  }
  speed: {
    down: number
    up: number
  }
  time: {
    remaining: number
    elapsed: number
  }
  peers: {
    seeders: number
    leechers: number
    wires: number
  }
  pieces: {
    total: number
    size: number
  }
  hash: string
}

export interface PeerInfo {
  ip: string
  seeder: boolean
  client: string
  progress: number
  size: {
    downloaded: number
    uploaded: number
  }
  speed: {
    down: number
    up: number
  }
  flags: Array<'incoming' | 'outgoing' | 'utp' | 'encrypted'>
  time: number
}

export interface FileInfo {
  name: string
  size: number
  progress: number
  selections: number
}

export interface ClientSettings {
  torrentPersist: boolean
  torrentDHT: boolean
  torrentStreamedDownload: boolean
  torrentSpeed: number
  maxConns: number
  torrentPort: number
  dhtPort: number
  torrentPeX: boolean
}

export interface LibraryEntry {
  mediaID: number
  episode: number
  files: number
  hash: string
  progress: number
  date: number
  size: number
  name: string
}

export interface SessionMetadata {
  title: string
  description: string
  image: string
}

export interface SubtitleTrack {
  number: number
  language: string
  type: string
  _compressed: boolean
  default: boolean
  forced: boolean
  name?: string
  header?: string
}

export interface Native {
  restart: () => Promise<void>
  openURL: (url: string) => Promise<void>
  share: Navigator['share']
  minimise: () => Promise<void>
  maximise: () => Promise<void>
  focus: () => Promise<void>
  close: () => Promise<void>
  version: () => Promise<string>
  isApp: boolean
  setZoom: (scale: number) => Promise<void>
  openUIDevtools: () => Promise<void>
  setHideToTray: (enabled: boolean) => Promise<void>
  setAngle: (angle: string) => Promise<void>
  enableCORS: (urls: string[]) => Promise<void>
  checkAvailableSpace: () => Promise<number>
  checkIncomingConnections: (port: number) => Promise<boolean>
  updatePeerCounts: (hashes: string[]) => Promise<Array<{ hash: string, complete: string, downloaded: string, incomplete: string }>>
  addTorrent: (id: string | ArrayBufferView, mediaID: number, episode: number, background: boolean) => Promise<TorrentFile[]>
  deleteTorrents: (hashes: string[]) => Promise<void>
  rescanTorrents: (hashes: string[]) => Promise<void>
  library: () => Promise<LibraryEntry[]>
  torrentInfo: (hash: string) => Promise<TorrentInfo>
  peerInfo: (hash: string) => Promise<PeerInfo[]>
  fileInfo: (hash: string) => Promise<FileInfo[]>
  trackers: (hash: string) => Promise<Record<string, { complete: number, downloaded: number, incomplete: number, failed: boolean }>>
  protocolStatus: (hash: string) => Promise<{
    dht: boolean
    pex: boolean
    nat: boolean
    forwarding: boolean
    persisting: boolean
    streaming: boolean
  }>
  cachedTorrents: () => Promise<string[]>
  activeTorrents: () => Promise<TorrentInfo[]>
  downloadProgress: (percent: number) => Promise<void>
  updateSettings: (settings: ClientSettings) => Promise<void>
  selectDownload: () => Promise<string>
  setMediaSession: (metadata: SessionMetadata, mediaId: number) => Promise<void>
  setPositionState: (state?: { duration?: number, playbackRate?: number, position?: number }, paused?: 'none' | 'paused' | 'playing') => Promise<void>
  setPlayBackState: (paused: 'none' | 'paused' | 'playing') => Promise<void>
  navigate: (cb: (data: { target: string, value: string | undefined }) => void) => Promise<void>
  updateAndRestart: () => Promise<void>
  updateReady: () => Promise<void>
  checkUpdate: () => Promise<void>
  updateProgress: (cb: (progress: number) => void) => Promise<void>
  subtitles: (hash: string, id: number, cb: (subtitle: SubtitleTrack | { text: string, time: number, duration: number }, trackNumber: number) => void) => Promise<void>
  errors: (cb: (error: Error) => void) => Promise<void>
}