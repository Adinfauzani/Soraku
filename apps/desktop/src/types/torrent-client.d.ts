import type { ClientSettings } from '@soraku/native'

declare module '@soraku/torrent-client' {
  interface TorrentData {
    infoHash: string
    torrent: string | ArrayBufferView | object
    mediaID: number
    episode: number
    background?: boolean
  }

  interface ScrapeResponse {
    hash: string
    complete: string
    downloaded: string
    incomplete: string
  }

  interface TorrentClient {
    constructor: (settings: ClientSettings & { path: string }, temp: string) => void
    updateSettings (settings: ClientSettings & { path: string }): void
    setDOH (dohServer: string): void
    checkIncomingConnections (testPort: number): Promise<boolean>
    checkAvailableSpace (): Promise<{ hasDriveSpace: boolean }>
    scrape (infoHashes: string[]): Promise<ScrapeResponse[]>
    toInfoHash (torrentId: string | ArrayBufferView): Promise<string>
    playTorrent (id: string | ArrayBufferView, mediaID: number, episode: number, sessionID: string, background: boolean): Promise<unknown>
    rescanTorrents (hashes: string[]): Promise<void>
    deleteTorrents (hashes: string[]): Promise<void>
    cached (): Promise<string[]>
    library (): Promise<unknown[]>
    trackers (id: string): Promise<unknown>
    torrents (): unknown
    createNZBWebSeed (id: string, url: string): Promise<void>
    createHTTPWebSeed (id: string, url: string, authorization?: string, fileIndex?: number, rateLimit?: number): Promise<void>
    torrentInfo (id: string): Promise<unknown>
    peerInfo (id: string): Promise<unknown[]>
    verifyDirectoryPermissions (path: string): Promise<boolean>
    evictOrphan (infoHash: string): Promise<void>
    playDisplay (host: string, hash: string, id: number, media: unknown): Promise<void>
    closeDisplay (host: string): Promise<void>
    destroy (): Promise<void>
    attachments: {
      register (torrent: unknown): void
      destroy (): void
      attachments (hash: string, id: number): Promise<unknown>
      tracks (hash: string, id: number): Promise<unknown>
      subtitle (hash: string, id: number, cb: (subtitle: { text: string, time: number, duration: number }, trackNumber: number) => void): Promise<void>
      chapters (hash: string, id: number): Promise<unknown>
    }
    activeTorrents (): Promise<unknown[]>
    fileInfo (id: string): Promise<unknown[]>
    protocolStatus (id: string): Promise<unknown>
    updateTorrentPriority (infoHash?: string): void
    loadBackgroundDownloads (): Promise<void>
    stopSession (sessionID: string): Promise<void>
  }

  const TorrentClient: {
    new (settings: ClientSettings & { path: string }, temp: string): TorrentClient
  }

  export default TorrentClient
}