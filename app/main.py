import sys
from pathlib import Path
import importlib.util

_api_dir = Path(__file__).resolve().parent.parent / "apps" / "api"
if str(_api_dir) not in sys.path:
    sys.path.insert(0, str(_api_dir))

# Dynamically load the authoritative FastAPI app from apps/api/app/main.py
_real_main_path = _api_dir / "app" / "main.py"
_spec = importlib.util.spec_from_file_location("apps_api_app_main", _real_main_path)
_mod = importlib.util.module_from_spec(_spec)
sys.modules["apps_api_app_main"] = _mod
_spec.loader.exec_module(_mod)

app = _mod.app
