# Miruro API (sidecar)

Python FastAPI scraper for **Miruro** (`miruro.bz` / `miruro.ru` / `miruro.to` / `miruro.tv`)
that bypasses Cloudflare's `secure/pipe` tunnel using `curl_cffi` with Chrome 110 TLS
impersonation. Exposes a tiny HTTP API consumed by the NestJS `Miruro` provider in
`apps/api/src/sources/miruro.ts` (same pattern as `infra/wajik-anime-api`).

## Why a sidecar

Miruro's pipe endpoint requires a real-browser TLS fingerprint (JA3/JA4). Node's built-in
`https`/`axios` gets **403** from Cloudflare on `miruro.bz`/`miruro.ru`. `curl_cffi`
(`impersonate="chrome110"`) is the only thing that works, and it is Python-only — so the
scraper runs as a small sidecar and the NestJS API calls it over HTTP.

## Run

```bash
pip install -r requirements.txt
PORT=3002 MIRURO_DOMAINS=miruro.bz,miruro.ru,miruro.to,miruro.tv uvicorn miruro_api:app --host 0.0.0.0 --port 3002
```

Docker:

```bash
docker compose up -d
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | `{ status, domains }` |
| GET | `/episodes/{anilistId}` | providers + episode lists, ids rewritten to `watch/{provider}/{anilistId}/{lang}/{prefix}-{N}` |
| GET | `/sources?episodeId=&provider=&anilistId=&category=` | `streams[]` (hls/embed), `subtitles[]`, `intro`/`outro` |
| GET | `/watch/{provider}/{anilistId}/{category}/{slug}` | resolve a slug from `/episodes` into sources |

## Environment

- `PORT` (default `3002`)
- `MIRURO_DOMAINS` comma-separated, order = fallback order (default `miruro.bz,miruro.ru,miruro.to,miruro.tv`)

## Verified (live)

- `/episodes/182205` → 200, providers `['kiwi','hop','ally','pewe','moo','bee','bonk']`, kiwi/sub 21 eps
- `/watch/kiwi/182205/sub/...-1` → `streams[]` with a real `hls` M3U8
  (`https://vault-16.owocdn.top/stream/.../uwu.m3u8`, 1080p h264 sub)