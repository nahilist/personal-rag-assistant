import os
import uuid
import re
from pathlib import Path
from typing import Optional
from app.core.config import settings
from app.core.logging import logger


class StorageService:
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.STORAGE_LOCAL_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _sanitize_filename(self, filename: str) -> str:
        # Keep only safe alphanumeric, dash, dot, and underscore
        clean = re.sub(r"[^a-zA-Z0-9_\.-]", "_", filename)
        return clean.strip("._") or "unnamed_file"

    def build_storage_key(self, user_id: uuid.UUID, document_id: uuid.UUID, filename: str) -> str:
        clean_name = self._sanitize_filename(filename)
        return f"{user_id}/{document_id}/{clean_name}"

    def _resolve_path(self, storage_key: str) -> Path:
        # Prevent path traversal
        norm_key = os.path.normpath(storage_key).lstrip("\\/").replace("\\", "/")
        target_path = (self.base_dir / norm_key).resolve()
        if not str(target_path).startswith(str(self.base_dir)):
            raise ValueError(f"Path traversal detected: {storage_key}")
        return target_path

    async def save_file(self, storage_key: str, data: bytes) -> int:
        target = self._resolve_path(storage_key)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return len(data)

    async def read_file(self, storage_key: str) -> bytes:
        target = self._resolve_path(storage_key)
        if not target.exists() or not target.is_file():
            raise FileNotFoundError(f"Storage object not found: {storage_key}")
        return target.read_bytes()

    async def delete_file(self, storage_key: str) -> bool:
        target = self._resolve_path(storage_key)
        if target.exists() and target.is_file():
            target.unlink()
            # Also clean up empty parent directories if any
            try:
                parent = target.parent
                if not any(parent.iterdir()):
                    parent.rmdir()
            except Exception:
                pass
            return True
        return False

    async def exists(self, storage_key: str) -> bool:
        target = self._resolve_path(storage_key)
        return target.exists() and target.is_file()

    async def get_size(self, storage_key: str) -> int:
        target = self._resolve_path(storage_key)
        if not target.exists() or not target.is_file():
            return 0
        return target.stat().st_size


storage_service = StorageService()
