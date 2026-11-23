interface CacheOptions {
  ttl: number
  swr?: number
}

export function createCacheKey(request: Request): string {
  const url = new URL(request.url)
  return url.pathname + url.search
}

async function getFromCache(request: Request): Promise<Response | null> {
  const cache = caches.default
  return cache.match(request)
}

async function storeInCache(
  request: Request,
  response: Response,
  options: CacheOptions,
): Promise<Response> {
  const cache = caches.default
  const headers = new Headers(response.headers)
  headers.set("Cache-Control", `public, s-maxage=${options.ttl}${options.swr ? `, stale-while-revalidate=${options.swr}` : ""}`)
  headers.set("CF-Cache-Status", "HIT")

  const cachedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })

  await cache.put(request, cachedResponse.clone())
  return cachedResponse
}

export async function fetchWithCache(
  request: Request,
  originUrl: string,
  options: CacheOptions,
): Promise<Response> {
  const cacheRequest = new Request(request.url, {
    method: "GET",
    headers: request.headers,
  })

  const cached = await getFromCache(cacheRequest)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(originUrl, {
      headers: {
        "User-Agent": "SorakuWorker/1.0",
        ...Object.fromEntries(request.headers),
      },
    })

    if (response.ok) {
      return storeInCache(cacheRequest, response, options)
    }

    return new Response(await response.text(), {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch {
    return new Response(
      JSON.stringify({
        error: true,
        message: "Origin unavailable",
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

export function cacheResponse(
  response: Response,
  ttl: number,
): Response {
  const headers = new Headers(response.headers)
  headers.set("Cache-Control", `public, s-maxage=${ttl}`)
  headers.set("CDN-Cache-Control", `public, s-maxage=${ttl}`)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
