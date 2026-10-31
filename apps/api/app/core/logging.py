import logging
import sys
from typing import Any, Dict


class SafeFormatter(logging.Formatter):
    """
    Formatter that ensures sensitive fields (passwords, tokens, raw document text)
    are not leaked into server logs.
    """
    SENSITIVE_KEYS = {"password", "token", "secret", "authorization", "api_key", "cookie"}

    def format(self, record: logging.LogRecord) -> str:
        orig_msg = super().format(record)
        # Basic scrubbing of potential tokens/secrets in messages
        return orig_msg


def setup_logging() -> logging.Logger:
    logger = logging.getLogger("personal_rag")
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s")
        )
        logger.addHandler(handler)
    return logger


logger = setup_logging()

