import { fetchWithCache } from "../utils/cache"

const SUBTITLE_CACHE_TTL = 86400

const SUBTITLE_SOURCES: Record<string, string> = {
  "anilist": "https://s4.anilist.co",
  "samehadaku": "https://samehadaku-api.vercel.app",
}

export async function handleSubtitleProxy(
  request: Request,
  path: string,
  env: { DEFAULT_SUBTITLE_LANG?: string; CACHE_TTL_IMAGE?: string },
): Promise<Response> {
  const segments = path.replace("/subtitle/", "").split("/")
  if (segments.length < 2) {
    return new Response(
      JSON.stringify({ error: "Invalid subtitle path. Expected /subtitle/{animeId}/{lang}.vtt" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const animeId = segments[0]
  const file = segments.slice(1).join("/")

  const originUrl = `https://api.soraku.app/api/anime/${animeId}/subtitles/${file}`
  const ttl = parseInt(env.CACHE_TTL_IMAGE || String(SUBTITLE_CACHE_TTL), 10)

  const response = await fetchWithCache(request, originUrl, { ttl })

  const contentType = file.endsWith(".vtt") ? "text/vtt" : "text/plain"
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": contentType,
  }

  const headers = new Headers(response.headers)
  Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value))

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
