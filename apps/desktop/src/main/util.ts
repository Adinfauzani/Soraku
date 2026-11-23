import { app } from 'electron'

import store from './store'

const flags: Array<[string, string | undefined] | [string]> = [
  ['disable-gpu-sandbox'],
  ['disable-direct-composition-video-overlays'],
  ['enable-zero-copy'],
  ['ignore-gpu-blocklist'],
  ['force_high_performance_gpu'],
  ['enable-features', 'PlatformEncryptedDolbyVision,CanvasOopRasterization,ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes,UseSkiaRenderer,WebAssemblyLazyCompilation,FluentOverlayScrollbar,FluentOverlayScrollbars,AutoPictureInPictureForVideoPlayback'],
  ['disable-features', 'WidgetLayering'],
  ['autoplay-policy', 'no-user-gesture-required'],
  ['disable-notifications'],
  ['disable-permissions-api'],
  ['no-zygote'],
  ['disable-renderer-backgrounding'],
  ['force-effective-connection-type', '4G'],
  ['disk-cache-size', '500000000'],
  ['use-angle', store.get('angle') || 'default']
]

for (const [flag, value] of flags) {
  app.commandLine.appendSwitch(flag, value)
}