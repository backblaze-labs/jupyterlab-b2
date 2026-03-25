"""jupyterlab-b2: JupyterLab extension for Backblaze B2 Cloud Storage.

Provides a sidebar file browser and REST API for B2 operations.
The REST API at ``/b2/api/v1/`` enables any frontend component
to interact with B2.
"""

from __future__ import annotations

from jupyterlab_b2._version import __version__  # noqa: F401


def _jupyter_labextension_paths() -> list[dict[str, str]]:
    """Register the frontend labextension."""
    return [{"src": "labextension", "dest": "jupyterlab-b2"}]


def _jupyter_server_extension_points() -> list[dict[str, str]]:
    """Register the server extension with Jupyter Server."""
    return [{"module": "jupyterlab_b2"}]


# Backward compatibility alias
_jupyter_server_extension_paths = _jupyter_server_extension_points


def _load_jupyter_server_extension(server_app: object) -> None:
    """Load the B2 server extension, registering all API handlers.

    Parameters
    ----------
    server_app : object
        The Jupyter Server application instance.
    """
    from jupyterlab_b2.handlers.routes import setup_handlers

    setup_handlers(server_app)  # type: ignore[arg-type]
    server_app.log.info("jupyterlab-b2 server extension loaded")  # type: ignore[attr-defined]
