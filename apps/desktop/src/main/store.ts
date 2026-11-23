import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { app } from 'electron'

const DEFAULTS = {
  angle: 'default',
  calculateFFmpegCache: false,
  torrentPath: '',
  torrentSettings: {
    torrentPersist: false,
    torrentDHT: false,
    torrentStreamedDownload: true,
    torrentSpeed: 40,
    maxConns: 50,
    torrentPort: 0,
    dhtPort: 0,
    torrentPeX: false
  }
}

type StoreData = typeof DEFAULTS

class Store {
  path: string
  data: StoreData = DEFAULTS
  constructor (configName: string) {
    this.path = join(app.getPath('userData'), configName + '.json')
    this.data = parseDataFile(this.path)
  }

  get<K extends keyof StoreData> (key: K): StoreData[K] {
    return this.data[key]
  }

  set<K extends keyof StoreData> (key: K, val: StoreData[K]) {
    this.data[key] = val
    void writeFile(this.path, JSON.stringify(this.data))
  }
}

function parseDataFile (filePath: string): StoreData {
  try {
    return { ...DEFAULTS, ...(JSON.parse(readFileSync(filePath).toString()) as StoreData) }
  } catch {
    return DEFAULTS
  }
}

export default new Store('settings')