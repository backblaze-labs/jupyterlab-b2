"""Base handler with shared B2 auth and JSON helpers."""

from __future__ import annotations

import html
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

from b2sdk.v3 import B2Api, InMemoryAccountInfo, SqliteAccountInfo
from jupyter_server.base.handlers import APIHandler

logger = logging.getLogger(__name__)

# Shared B2 API instance across all handlers
_b2_api: B2Api | None = None


def _safe_json_dumps(value: Any) -> str:
    """Serialize JSON without raw HTML-significant characters."""
    return json.dumps(value).replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")


def get_b2_api() -> B2Api:
    """Get the shared authenticated B2Api instance.

    Tries three auth strategies in order:
    1. Already authenticated (cached)
    2. Environment variables (B2_APPLICATION_KEY_ID + B2_APPLICATION_KEY)
    3. B2 CLI stored credentials (~/.b2_account_info or XDG path)

    Returns
    -------
    B2Api
        The authenticated B2 API client.

    Raises
    ------
    RuntimeError
        If no authentication method succeeds.
    """
    global _b2_api  # noqa: PLW0602
    if _b2_api is not None:
        return _b2_api

    # Strategy 1: env vars
    key_id = os.environ.get("B2_APPLICATION_KEY_ID")
    app_key = os.environ.get("B2_APPLICATION_KEY")
    if key_id and app_key:
        logger.info("jupyterlab-b2: authenticating from environment variables")
        return set_b2_api(key_id, app_key)

    # Strategy 2: B2 CLI stored credentials
    try:
        return _auth_from_cli()
    except Exception as e:
        logger.debug(f"jupyterlab-b2: CLI auth failed: {e}")

    raise RuntimeError(
        "Not authenticated. Options:\n"
        "  1. Set B2_APPLICATION_KEY_ID and B2_APPLICATION_KEY env vars\n"
        "  2. Run 'b2 authorize-account' in your terminal\n"
        "  3. POST to /b2/api/v1/auth with key_id and app_key"
    )


def _auth_from_cli() -> B2Api:
    """Authenticate using B2 CLI's stored credentials.

    The B2 CLI stores credentials in a SQLite database at:
    - ``~/.b2_account_info`` (default)
    - ``$XDG_CONFIG_HOME/b2/account_info`` (Linux/BSD)

    Returns
    -------
    B2Api
        The authenticated B2 API client.
    """
    global _b2_api

    # Check default path first
    default_path = Path.home() / ".b2_account_info"
    xdg_path = None
    xdg_config = os.environ.get("XDG_CONFIG_HOME", "")
    if xdg_config:
        xdg_path = Path(xdg_config) / "b2" / "account_info"
    elif Path.home().joinpath(".config", "b2").exists():
        xdg_path = Path.home() / ".config" / "b2" / "account_info"

    # Try SqliteAccountInfo which handles path resolution
    try:
        info = SqliteAccountInfo()
        api = B2Api(info)
        # Verify the stored auth is still valid by getting account id
        _ = info.get_account_id()
        _b2_api = api
        logger.info("jupyterlab-b2: authenticated from B2 CLI stored credentials")
        return api
    except Exception:
        pass

    # Try explicit paths
    for path in [default_path, xdg_path]:
        if path and path.exists():
            try:
                info = SqliteAccountInfo(str(path))
                api = B2Api(info)
                _ = info.get_account_id()
                _b2_api = api
                logger.info(f"jupyterlab-b2: authenticated from {path}")
                return api
            except Exception:
                continue

    raise RuntimeError("No B2 CLI credentials found")


def set_b2_api(key_id: str, app_key: str) -> B2Api:
    """Authenticate and set the shared B2Api instance.

    Parameters
    ----------
    key_id : str
        B2 application key ID.
    app_key : str
        B2 application key.

    Returns
    -------
    B2Api
        The authenticated B2 API client.
    """
    global _b2_api
    info = InMemoryAccountInfo()
    api = B2Api(info)
    api.authorize_account(key_id, app_key, realm="production")
    _b2_api = api
    return api


def is_authenticated() -> bool:
    """Check if B2 is authenticated."""
    return _b2_api is not None


class B2BaseHandler(APIHandler):
    """Base handler with XSRF bypass and JSON helpers.

    Disables XSRF protection for API endpoints since the JupyterLab
    frontend and external clients authenticate via the Jupyter token
    in the Authorization header.
    """

    def check_xsrf_cookie(self) -> None:
        """Skip XSRF check — API uses token auth."""

    def json_body(self) -> dict[str, Any]:
        """Parse the request body as JSON.

        Returns
        -------
        dict
            Parsed JSON body, or empty dict on error.
        """
        try:
            return json.loads(self.request.body or b"{}")
        except json.JSONDecodeError:
            return {}

    @classmethod
    def _sanitize_message(cls, value: Any) -> str:
        """Escape a human-readable response message."""
        return html.escape(str(value), quote=True)

    def success(self, data: Any = None, message: str = "ok") -> None:
        """Write a success JSON response.

        Parameters
        ----------
        data : Any, optional
            Response payload.
        message : str, optional
            Human-readable message.
        """
        self.set_header("Content-Type", "application/json")
        self.write(
            _safe_json_dumps(
                {
                    "status": "ok",
                    "message": B2BaseHandler._sanitize_message(message),
                    "data": data,
                }
            )
        )
        self.finish()

    def error(self, message: str, status: int = 400) -> None:
        """Write an error JSON response.

        Parameters
        ----------
        message : str
            Error description.
        status : int, optional
            HTTP status code (default 400).
        """
        response_message = B2BaseHandler._sanitize_message(message)
        if status >= 500:
            logger.error(
                "Internal server error: %s",
                message,
                exc_info=sys.exc_info()[0] is not None,
            )
            response_message = "An internal error has occurred."

        self.set_status(status)
        self.set_header("Content-Type", "application/json")
        self.write(
            _safe_json_dumps(
                {
                    "status": "error",
                    "message": response_message,
                }
            )
        )
        self.finish()

    def exception(
        self,
        error: Exception,
        status: int = 500,
        message: str = "Request failed.",
    ) -> None:
        """Log an exception and return a generic error response."""
        logger.error(
            "B2 handler request failed",
            exc_info=(type(error), error, error.__traceback__),
        )
        B2BaseHandler.error(self, message, status=status)
