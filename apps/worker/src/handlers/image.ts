import { fetchWithCache } from "../utils/cache"

const IMAGE_CACHE_TTL = 86400

const IMAGE_SOURCES: Record<string, string> = {
  "myanimelist": "https://cdn.myanimelist.net",
  "anilist": "https://s4.anilist.co",
  "kitsu": "https://media.kitsu.io",
}

export async function handleImageProxy(
  request: Request,
  path: string,
  env: { CACHE_TTL_IMAGE?: string },
): Promise<Response> {
  const segments = path.replace("/image/", "").split("/")
  if (segments.length < 2) {
    return new Response(
      JSON.stringify({ error: "Invalid image path" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const source = segments[0]
  const imagePath = segments.slice(1).join("/")

  const sourceBaseUrl = IMAGE_SOURCES[source]
  if (!sourceBaseUrl) {
    const directUrl = decodeURIComponent(path.replace("/image/", ""))
    return proxyDirectImage(request, directUrl, env)
  }

  const originUrl = `${sourceBaseUrl}/${imagePath}`
  const ttl = parseInt(env.CACHE_TTL_IMAGE || String(IMAGE_CACHE_TTL), 10)

  return fetchWithCache(request, originUrl, { ttl })
}

async function proxyDirectImage(
  request: Request,
  url: string,
  env: { CACHE_TTL_IMAGE?: string },
): Promise<Response> {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return new Response(
      JSON.stringify({ error: "Invalid image URL" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const ttl = parseInt(env.CACHE_TTL_IMAGE || String(IMAGE_CACHE_TTL), 10)
  return fetchWithCache(request, url, { ttl })
}
