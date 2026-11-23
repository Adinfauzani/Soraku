"""Miruro pipe scraper (curl_cffi chrome110) — Python sidecar for Soraku API.

Exposes a tiny HTTP API mirroring the wajik-anime-api pattern:
  GET /health
  GET /episodes/:anilistId          -> { providers, mappings }
  GET /sources                      -> { streams[], subtitles[], intro?, outro?, download? }

4-domain fallback: miruro.bz -> miruro.ru -> miruro.to -> miruro.tv
Only domains that respond with a non-empty pipe body are used.
"""
import base64
import gzip
import json
import os
import sys

from curl_cffi.requests import AsyncSession
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="Miruro API (sidecar)", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
HEADERS = {
    "User-Agent": UA,
    "Referer": "https://www.miruro.tv/",
    "Origin": "https://www.miruro.tv",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "sec-ch-ua": '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
}

DOMAINS = [d for d in os.environ.get("MIRURO_DOMAINS", "miruro.bz,miruro.ru,miruro.to,miruro.tv").split(",") if d]

MIRURO_PROXY_URL = os.environ.get("MIRURO_PROXY_URL", "").strip()


def _proxies() -> dict | None:
    if not MIRURO_PROXY_URL:
        return None
    return {"http": MIRURO_PROXY_URL, "https": MIRURO_PROXY_URL}

MIRURO_PIPE_URL = "https://{dom}/api/secure/pipe"


def _enc(payload: dict) -> str:
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")


def _dec(text: str) -> dict:
    s = text.strip()
    s += "=" * (4 - len(s) % 4)
    return json.loads(gzip.decompress(base64.urlsafe_b64decode(s)).decode("utf-8"))


def _inject_slugs(data: dict, anilist_id: int) -> dict:
    """Rewrite provider episode ids into watch/{provider}/{anilistId}/{lang}/{prefix}-{N} slugs."""
    providers = data.get("providers", {})
    for pname, pdata in providers.items():
        if not isinstance(pdata, dict):
            continue
        episodes = pdata.get("episodes", {})
        if isinstance(episodes, list):
            pdata["episodes"] = {"sub": episodes}
            episodes = pdata["episodes"]
        if not isinstance(episodes, dict):
            continue
        for category, ep_list in episodes.items():
            if not isinstance(ep_list, list):
                continue
            for ep in ep_list:
                if not isinstance(ep, dict) or "id" not in ep or "number" not in ep:
                    continue
                orig = ep["id"]
                prefix = orig.split(":")[0] if ":" in orig else orig
                ep["id"] = f"watch/{pname}/{anilist_id}/{category}/{prefix}-{ep['number']}"
    return data


async def _pipe(path: str, query: dict) -> dict:
    payload = {"path": path, "method": "GET", "query": query, "body": None, "version": "0.1.0"}
    e = _enc(payload)
    last_err = None
    for dom in DOMAINS:
        url = MIRURO_PIPE_URL.format(dom=dom) + f"?e={e}"
        try:
            async with AsyncSession(proxies=_proxies(), impersonate="chrome110") as client:
                r = await client.get(url, headers=HEADERS, timeout=25)
                if r.status_code != 200 or not r.content:
                    last_err = f"{dom}: status={r.status_code} len={len(r.content)}"
                    continue
                try:
                    return _dec(r.text.strip())
                except Exception as ex:
                    last_err = f"{dom}: decode failed ({ex})"
                    continue
        except Exception as ex:
            last_err = f"{dom}: {type(ex).__name__} {ex}"
            continue
    raise HTTPException(status_code=502, detail=f"miruro pipe failed: {last_err or 'no domains'}")


@app.get("/health")
async def health():
    return {"status": "ok", "domains": DOMAINS}


@app.get("/episodes/{anilist_id}")
async def episodes(anilist_id: int):
    data = await _pipe("episodes", {"anilistId": anilist_id})
    return _inject_slugs(data, anilist_id)


@app.get("/sources")
async def sources(
    episodeId: str = Query(...),
    provider: str = Query(...),
    anilistId: int = Query(...),
    category: str = Query("sub"),
):
    return await _pipe("sources", {"episodeId": episodeId, "provider": provider, "category": category, "anilistId": anilistId})


@app.get("/watch/{provider}/{anilist_id}/{category}/{slug}")
async def watch(provider: str, anilist_id: int, category: str, slug: str):
    """Resolve an episode slug (from /episodes) into streaming sources."""
    data = await _pipe("episodes", {"anilistId": anilist_id})
    prov_data = data.get("providers", {}).get(provider, {})
    ep_list = prov_data.get("episodes", {}).get(category, [])
    target_id = None
    for ep in ep_list:
        orig = ep.get("id", "")
        prefix = orig.split(":")[0] if ":" in orig else orig
        if f"{prefix}-{ep.get('number')}" == slug:
            target_id = orig
            break
    if not target_id:
        raise HTTPException(status_code=404, detail=f"slug '{slug}' not found for {provider}")
    return await _pipe("sources", {"episodeId": target_id, "provider": provider, "category": category, "anilistId": anilist_id})


if __name__ == "__main__":
    import uvicorn

    # bot-hosting.net panels hand you the public primary port via SERVER_PORT
    # (see their deploy doc). Fall back to PORT, then a sane default.
    port = int(os.environ.get("SERVER_PORT") or os.environ.get("PORT") or "3002")
    uvicorn.run(app, host="0.0.0.0", port=port)