const STREAM_MARKERS = [
  "#EXT-X-STREAM-INF",
  "#EXT-X-I-FRAME-STREAM-INF",
  "#EXT-X-MEDIA",
]

export function rewriteM3U8(
  manifest: string,
  baseUrl: string,
  workerStreamBase: string,
): string {
  const lines = manifest.split("\n")
  const rewritten = lines.map((line) => {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      if (STREAM_MARKERS.some((m) => trimmed.startsWith(m))) {
        return rewriteStreamInfLine(trimmed, baseUrl, workerStreamBase)
      }
      return line
    }

    if (isAbsoluteUrl(trimmed)) {
      return `${workerStreamBase}/${encodeURIComponent(trimmed)}`
    }

    if (isRelativeSegment(trimmed)) {
      const resolved = resolveUrl(baseUrl, trimmed)
      return `${workerStreamBase}/${encodeURIComponent(resolved)}`
    }

    return line
  })

  return rewritten.join("\n")
}

function rewriteStreamInfLine(
  line: string,
  baseUrl: string,
  workerStreamBase: string,
): string {
  const uriMatch = line.match(/URI="([^"]*)"/)
  if (!uriMatch) return line

  const originalUri = uriMatch[1]
  const resolvedUri = isAbsoluteUrl(originalUri)
    ? originalUri
    : resolveUrl(baseUrl, originalUri)

  const newUri = `${workerStreamBase}/${encodeURIComponent(resolvedUri)}`
  return line.replace(/URI="([^"]*)"/, `URI="${newUri}"`)
}

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://")
}

function isRelativeSegment(path: string): boolean {
  return (
    path.endsWith(".ts") ||
    path.endsWith(".m4s") ||
    path.endsWith(".vtt") ||
    path.endsWith(".aac") ||
    path.endsWith(".mp3") ||
    !path.includes(".") ||
    path.includes("?")
  )
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href
  } catch {
    return relative
  }
}
