// Embedded web app server for production Soraku desktop builds.
//
// The web app (`apps/web`) is built and copied into this package at build time
// (see `scripts/embed-web.mjs`) then served through the custom `soraku://`
// scheme so the desktop shell works fully offline. Any `/api/*` request issued
// by the renderer is proxied in-process to the remote API host so the app keeps
// behaving exactly like the hosted PWA.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, normalize, extname } from 'node:path'

import { net, protocol } from 'electron'

const SCHEME = 'soraku'
export const PRODUCTION_BASE_URL = `${SCHEME}://app/`

// The mutable path where `dist/` of apps/web is copied at package time.
function webRoot (): string {
  // Packaged: extraResources copies resources-web/ → resources/web/dist.
  const packaged = join(process.resourcesPath, 'web', 'dist')
  if (existsSync(packaged)) return packaged
  // Dev: fall back to the source-adjacent copy made by scripts/embed-web.mjs.
  const dev = join(__dirname, '../..', 'resources-web', 'dist')
  return dev
}

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
}

/** Serve a local file from the bundled web dist, falling back to index.html. */
function serveFile (requestUrl: string): globalThis.Response {
  const root = webRoot()
  const parsed = new URL(requestUrl)
  let pathname = parsed.pathname
  try {
    pathname = decodeURIComponent(pathname)
  } catch {
    // leave as-is
  }
  let target = join(root, normalize(pathname || '/'))
  if (!target.startsWith(root + '/') && target !== root) target = join(root, 'index.html')

  if (target === root || !existsSync(target) || statSync(target).isDirectory()) {
    target = join(root, 'index.html')
  }
  if (extname(target) === '') target = join(root, 'index.html')

  const body = readFileSync(target)
  const mime = MIME[extname(target)] || 'application/octet-stream'
  return new globalThis.Response(body, {
    status: 200,
    headers: {
      'content-type': mime + (mime === 'text/html' ? '; charset=utf-8' : ''),
      'cache-control': mime === 'text/html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, HEAD, OPTIONS',
      'access-control-allow-headers': '*'
    }
  })
}

/** Forward a renderer /api request to the remote API host. */
function proxyApi (requestUrl: string, init: RequestInit): Promise<globalThis.Response> {
  const u = new URL(requestUrl)
  const targetUrl = 'https://sorakuapi.vercel.app' + u.pathname + u.search

  return new Promise<globalThis.Response>((resolve, reject) => {
    const req = net.request(targetUrl)
    const method = (init.method ?? 'GET').toUpperCase()
    const headers = new Headers(init.headers || {})
    headers.set('origin', 'https://sorakuapi.vercel.app')
    headers.set('referer', 'https://sorakuapi.vercel.app/')
    headers.set('user-agent', 'Mozilla/5.0')

    const bodyBytes: Buffer | null =
      init.body == null ? null
        : typeof init.body === 'string' ? Buffer.from(init.body)
          : Buffer.from(init.body as ArrayBuffer)
    if (method !== 'GET' && method !== 'HEAD' && bodyBytes) {
      headers.set('content-length', String(bodyBytes.byteLength))
    }

    req.setHeader('content-type', headers.get('content-type') || 'application/json')
    for (const [k, v] of headers.entries()) {
      if (k.toLowerCase() === 'content-type') continue
      req.setHeader(k, v)
    }

    req.on('response', (resp) => {
      const status = resp.statusCode ?? 502
      const rheaders = new Headers()
      const rmap: Record<string, string[]> = resp.headers as unknown as Record<string, string[]>
      for (const key of Object.keys(rmap ?? {})) {
        const val = rmap[key]
        rheaders.set(key, Array.isArray(val) ? val.join(',') : String(val))
      }
      rheaders.set('access-control-allow-origin', '*')
      rheaders.set('access-control-allow-methods', '*')
      rheaders.set('access-control-allow-headers', '*')

      const chunks: Buffer[] = []
      resp.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      resp.on('end', () => {
        resolve(new globalThis.Response(Buffer.concat(chunks), { status, headers: rheaders }))
      })
      resp.on('error', (err) => reject(err))
    })

    req.on('error', (err) => reject(err))
    if (bodyBytes) req.write(bodyBytes)
    req.end()
  })
}

export function registerEmbeddedProtocol (): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
        bypassCSP: true
      }
    }
  ])
}

export function installEmbeddedServer (): void {
  protocol.handle(SCHEME, async (request) => {
    const url = new URL(request.url)
    if (url.hostname !== 'app') {
      return new globalThis.Response('{"error":"unsupported host"}', { status: 400, headers: { 'access-control-allow-origin': '*' } })
    }
    if (request.method === 'OPTIONS') {
      return new globalThis.Response(null, { status: 204, headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'access-control-allow-headers': '*'
      } })
    }
    if (url.pathname.startsWith('/api')) {
      const init: RequestInit = {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      }
      const body = await request.arrayBuffer().catch(() => null)
      if (body && body.byteLength > 0) init.body = body
      return await proxyApi(request.url, init)
    }
    return serveFile(request.url)
  })
}