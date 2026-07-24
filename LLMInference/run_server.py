"""
Convenience launcher for the inference API — run it the familiar way:

    python run_server.py

This is the FastAPI equivalent of Django's `manage.py runserver` or Flask's
`app.run()`: it calls uvicorn (the ASGI server) from inside Python instead of
from the command line. Same result as:

    uvicorn inference_service.app:app --app-dir src --port 8000
"""

from __future__ import annotations

import pathlib
import sys

# Put src/ on the path so `inference_service` and `llm_core` import cleanly,
# the same thing `--app-dir src` does on the uvicorn command line.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / "src"))

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "inference_service.app:app",
        host="127.0.0.1",
        port=8000,
        reload=False,  # reload spawns a subprocess that loses our sys.path tweak
    )
