import { Hono } from "hono"
import { cors } from "hono/cors"
import { handleImageProxy } from "./handlers/image"
import { handleSubtitleProxy } from "./handlers/subtitle"
import { handleStreamProxy } from "./handlers/stream"
import { handleApiProxy } from "./handlers/api"
import type { Env } from "./types"

const app = new Hono<{ Bindings: Env }>()

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "OPTIONS"],
}))

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  })
})

app.get("/info/:animeId/:slug", async (c) => {
  const { animeId, slug } = c.req.param()
  const path = `/api/anime/${animeId}/${slug}`
  const response = await handleApiProxy(c.req.raw, path, c.env)

  if (response.ok) {
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60")
  }

  return response
})

app.get("/watch/:animeId/:slug", async (c) => {
  const { animeId, slug } = c.req.param()
  const ep = c.req.query("ep")
  const path = `/api/watch/${animeId}/episodes${ep ? `?ep=${ep}` : ""}`
  return handleApiProxy(c.req.raw, path, c.env)
})

app.get("/trending", async (c) => {
  return handleApiProxy(c.req.raw, "/api/trending", c.env)
})

app.get("/schedule", async (c) => {
  return handleApiProxy(c.req.raw, "/api/schedule", c.env)
})

app.get("/search", async (c) => {
  const q = c.req.query("q")
  if (!q) {
    return c.json({ error: "Query parameter 'q' is required" }, 400)
  }
  return handleApiProxy(c.req.raw, `/api/search?query=${encodeURIComponent(q)}`, c.env)
})

app.get("/image/*", async (c) => {
  const path = new URL(c.req.url).pathname
  return handleImageProxy(c.req.raw, path, c.env)
})

app.get("/subtitle/*", async (c) => {
  const path = new URL(c.req.url).pathname
  return handleSubtitleProxy(c.req.raw, path, c.env)
})

app.get("/stream/*", async (c) => {
  const path = new URL(c.req.url).pathname
  return handleStreamProxy(c.req.raw, path, c.env)
})

app.get("/", (c) => {
  return c.json({
    name: "Soraku Media Worker",
    version: "0.1.0",
    endpoints: {
      health: "/health",
      animeInfo: "/info/:animeId/:slug",
      animeWatch: "/watch/:animeId/:slug?ep=:episode",
      trending: "/trending",
      schedule: "/schedule",
      search: "/search?q=",
      image: "/image/*",
      subtitle: "/subtitle/*",
      stream: "/stream/*",
    },
  })
})

app.onError((err, c) => {
  console.error("Worker error:", err)
  return c.json({
    error: true,
    message: "Internal server error",
    status: 500,
  }, 500)
})

export default app
