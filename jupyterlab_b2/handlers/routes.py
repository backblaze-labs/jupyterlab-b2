"""Route registration for B2 API handlers."""

from __future__ import annotations

from typing import Any

from jupyterlab_b2.handlers.b2_handlers import (
    AuthHandler,
    BucketInfoHandler,
    BucketsHandler,
    CreateBucketHandler,
    DeleteBucketHandler,
    DeleteHandler,
    DownloadHandler,
    FileInfoHandler,
    ListFilesHandler,
    LoadHandler,
    OpenHandler,
    PresignHandler,
    RenameHandler,
    StatusHandler,
    UpdateBucketHandler,
    UploadBytesHandler,
    UploadHandler,
)

API_PREFIX = "/b2/api/v1"


def setup_handlers(server_app: Any) -> None:
    """Register all B2 API handlers with the Jupyter Server.

    Parameters
    ----------
    server_app : Any
        The Jupyter Server application instance.
    """
    web_app = server_app.web_app
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"].rstrip("/")
    route = f"{base_url}{API_PREFIX}"

    server_app.log.info(f"jupyterlab-b2: registering API at {route}/")

    handlers = [
        (f"{route}/auth", AuthHandler),
        (f"{route}/status", StatusHandler),
        (f"{route}/buckets", BucketsHandler),
        (f"{route}/ls", ListFilesHandler),
        (f"{route}/info", FileInfoHandler),
        (f"{route}/upload", UploadHandler),
        (f"{route}/download", DownloadHandler),
        (f"{route}/load", LoadHandler),
        (f"{route}/presign", PresignHandler),
        (f"{route}/delete", DeleteHandler),
        (f"{route}/open", OpenHandler),
        (f"{route}/create-bucket", CreateBucketHandler),
        (f"{route}/delete-bucket", DeleteBucketHandler),
        (f"{route}/upload-bytes", UploadBytesHandler),
        (f"{route}/rename", RenameHandler),
        (f"{route}/bucket-info", BucketInfoHandler),
        (f"{route}/update-bucket", UpdateBucketHandler),
    ]

    web_app.add_handlers(host_pattern, handlers)
