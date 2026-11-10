import os
import sys
from pathlib import Path

# Add apps/api to sys.path so app submodules and settings work from anywhere
BASE_DIR = Path(__file__).resolve().parent
API_DIR = BASE_DIR / "apps" / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, app_dir=str(API_DIR))
