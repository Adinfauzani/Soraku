# New Context — Miruro provider (Sorami)

File ini pengganti konteks lama. Isi: inti masalah, keputusan user, posisi aktif & langkah berikutnya. Per singkat.

## (a) Inti masalah Miruro

- **Provider Miruro = akses via pipe Cloudflare.** Semua endpoint (`/episodes`, `/sources`/`watch`) harus nembus pipe `https://{dom}/api/secure/pipe?e=<base64url(gzip-json)>`. Butuh **curl_cffi chrome110 impersonation** (Python-only; Node/axios timeout) → makanya sidecar Python terpisah, bukan di NestJS.
- **4 domain fallback** di sidecar `miruro_api.py`: `miruro.<bz → ru → to → tv>` (env `MIRURO_DOMAINS`, default semua 4).
- **403 = blokir IP Cloudflare, bukan bug kode.** Terbukti live:
  - Dari **IP yang lolos** (env ini): `/episodes/182205` → **200, 6 provider** (`ally pewe moo bee kiwi hop`), `/health` OK.
  - Dari **IP panel bot-hosting** (IP datacenter): **403 len=6480** (halaman blokir Cloudflare) → API panel dapat **502**.
  - Domains `.bz`/`.ru` secara konsisten lolos dari IP lolos; `.to`/`.tv` hanya hidup tergantung IP.

## (b) Keputusan user (terkonfirmasi)

1. Memakai **sidecar Python** `infra/miruro-api` (bukan ngrok sebagai host utama).
2. Deploy sidecar ke **panel bot-hosting.net** (`core.apps.bot-hosting.cloud`, port 25264; STARTUP_FILE=miruro_api.py). **/health 200 di panel** → sidecar hidup, tapi **pipe 403 dari panel**.
3. **Pilih jalur 2: tanpa proxy → pindah ke IP yang lolos.** Artinya sidecar harus berjalan di host yang IP-nya **tidak** diblokir Cloudflare Miruro (bukan bot-hosting datacenter). Ekspor `MIRURO_PROXY_URL` (kosong = direkt) sebagai hook opsional kalau nanti ada proxy.

## (c) Posisi aktif & langkah berikutnya

- Sidecar `:3002` di env ini **hidup & lolos** — `/health` dan pipe `/episodes/182205` → 6 provider penuh. Ini bukti kode benar.
- **Bloker aktif:** `core.apps.bot-hosting.cloud` (panel) balas **502** karena **IP-nya diblokir 403** Miruro; tunnel ngrok tidak bisa dijaga hidup di tool ini (daemon menahan tool sampai timeout).

### Next move
1. Jalankan sidecar di host yang **IP-nya lolos** (VPS non-datacenter / mesin rumah — sama seperti IP env ini).
2. Set `MIRURO_API_URL=<url-publik-sidecar>` di `.env` API panel; kubukti `/episodes/182205` penuh via API Sorami.
3. (Opsional nanti) Set `MIRURO_PROXY_URL` di panel kalau ada proxy residential.

**File kunci:** `infra/miruro-api/miruro_api.py` (sidecar), `apps/api/src/sources/miruro.ts` (client provider), `apps/api/src/sources/module.ts`, `apps/api/src/servers.config.ts`, `.env` API (`MIRURO_API_URL`).
