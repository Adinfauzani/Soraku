"""Panel entrypoint — runs the Miruro pipe sidecar under the panel's default
`python3 -u ${STARTUP_FILE}` start command (no venv: bot-hosting installs deps
into the user-local site-packages during the build step)."""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "3002"))
    uvicorn.run("miruro_api:app", host="0.0.0.0", port=port)
