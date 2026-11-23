import { statSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'

import { expose } from 'abslink/w3c'
import TorrentClient from '@soraku/torrent-client'

import type { ClientSettings } from '@soraku/native'

interface Message {
  id: string
  data: unknown
}

let TMP: string
try {
  if (statSync('/tmp').isDirectory()) TMP = join('/tmp', 'soraku-torrents')
  else TMP = join(os.tmpdir(), 'soraku-torrents')
} catch {
  TMP = join(os.tmpdir(), 'soraku-torrents')
}

process.parentPort.on('message', ({ ports, data: _data }) => {
  let settings: ClientSettings & { path: string } | undefined
  const { id, data } = _data as Message
  if (id === 'settings') settings = data as ClientSettings & { path: string }
  if (id === 'destroy') tclient?.destroy()

  if (ports[0]) {
    ports[0].start()
    tclient ??= new TorrentClient(settings!, TMP)
    expose(tclient, ports[0] as unknown as MessagePort)
  } else if (settings) {
    tclient?.updateSettings(settings)
  }
})

let tclient: TorrentClient | undefined