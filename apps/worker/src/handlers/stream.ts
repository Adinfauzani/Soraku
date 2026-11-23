import { rewriteM3U8 } from "../utils/m3u8"
import { createCacheKey, cacheResponse } from "../utils/cache"

const STREAM_CACHE_TTL = 3600

export async function handleStreamProxy(
  request: Request,
  path: string,
  env: { CACHE_TTL_STREAM?: string },
): Promise<Response> {
  const streamPath = path.replace("/stream/", "")
  const decodedUrl = decodeURIComponent(streamPath)

  if (!decodedUrl.startsWith("http://") && !decodedUrl.startsWith("https://")) {
    return new Response(
      JSON.stringify({ error: "Invalid stream URL" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const ttl = parseInt(env.CACHE_TTL_STREAM || String(STREAM_CACHE_TTL), 10)

  try {
    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent": "SorakuWorker/1.0",
        Origin: "https://soraku.app",
        Referer: "https://soraku.app/",
      },
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: true,
          message: `Stream source returned ${response.status}`,
          status: response.status,
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      )
    }

    const contentType = response.headers.get("Content-Type") || ""

    if (contentType.includes("m3u8") || contentType.includes("application/vnd.apple.mpegurl")) {
      const text = await response.text()
      const baseUrl = getBaseUrl(decodedUrl)
      const workerStreamBase = `${new URL(request.url).origin}/stream`
      const rewritten = rewriteM3U8(text, baseUrl, workerStreamBase)

      const headers = new Headers({
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": `public, s-maxage=${ttl}`,
      })

      return new Response(rewritten, { headers })
    }

    const headers = new Headers(response.headers)
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("Cache-Control", `public, s-maxage=${ttl}`)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch {
    return new Response(
      JSON.stringify({
        error: true,
        message: "Stream unavailable",
        status: 502,
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
  }
}

function getBaseUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.origin + parsed.pathname.substring(0, parsed.pathname.lastIndexOf("/") + 1)
  } catch {
    return url
  }
}
