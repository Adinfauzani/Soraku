import { fetchWithCache } from "../utils/cache"

const API_CACHE_TTL = 300

export async function handleApiProxy(
  request: Request,
  path: string,
  env: { ORIGIN_API_URL?: string; CACHE_TTL_API?: string },
): Promise<Response> {
  const origin = env.ORIGIN_API_URL || "https://sorakuapi.vercel.app"
  const targetUrl = `${origin}${path}${path.includes("?") ? "" : request.url.includes("?") ? "?" + new URL(request.url).searchParams.toString() : ""}`

  const ttl = parseInt(env.CACHE_TTL_API || String(API_CACHE_TTL), 10)
  const response = await fetchWithCache(request, targetUrl, { ttl })

  const corsHeaders = new Headers(response.headers)
  corsHeaders.set("Access-Control-Allow-Origin", "*")
  corsHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS")

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: corsHeaders,
  })
}
