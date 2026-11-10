import sys
from pathlib import Path

_api_dir = Path(__file__).resolve().parent.parent / "apps" / "api"
if str(_api_dir) not in sys.path:
    sys.path.insert(0, str(_api_dir))

# Extend package search path so app.core, app.api, etc. resolve seamlessly
_real_app_dir = _api_dir / "app"
if str(_real_app_dir) not in __path__:
    __path__.append(str(_real_app_dir))
