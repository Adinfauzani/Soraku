import { optimizer } from '@electron-toolkit/utils'
import { app } from 'electron'

import App from './app.ts'
import { registerEmbeddedProtocol, installEmbeddedServer } from './embedded.ts'

let main: App | undefined

registerEmbeddedProtocol()

function createWindow () {
  installEmbeddedServer()
  main = new App()
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('ready', createWindow)

  app.on('activate', () => {
    if (main == null) createWindow()
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
}