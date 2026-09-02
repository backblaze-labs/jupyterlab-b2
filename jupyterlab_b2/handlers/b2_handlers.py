"""REST API handlers for B2 operations.

All endpoints are mounted under ``/b2/api/v1/`` by the route setup.
"""

from __future__ import annotations

import base64
import io
import mimetypes
import os
from pathlib import Path

from tornado import web

from jupyterlab_b2.handlers.base import (
    B2BaseHandler,
    get_b2_api,
    is_authenticated,
    set_b2_api,
)


def _parse_b2_path(path: str) -> tuple[str, str]:
    """Split ``bucket/key`` or ``b2://bucket/key`` into components.

    Parameters
    ----------
    path : str
        B2 path string.

    Returns
    -------
    tuple[str, str]
        (bucket_name, file_key).
    """
    if path.startswith("b2://"):
        path = path[5:]
    parts = path.split("/", 1)
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], parts[1]


def _is_relative_to(path: Path, base: Path) -> bool:
    try:
        path.relative_to(base)
    except ValueError:
        return False
    return True


def _resolve_under(base: Path, path: str | Path) -> Path:
    if not isinstance(path, str | Path):
        raise TypeError("Path must be a string")
    resolved_base = base.expanduser().resolve()
    candidate = Path(path)
    if candidate.is_absolute():
        resolved = candidate.expanduser().resolve()
    else:
        resolved = (resolved_base / candidate).expanduser().resolve()
    if not _is_relative_to(resolved, resolved_base):
        raise ValueError("Path is outside the allowed directory")
    return resolved


def _safe_bucket_cache_dir(cache_root: Path, bucket_name: str) -> Path:
    if not isinstance(bucket_name, str):
        raise TypeError("Bucket name must be a string")
    if not bucket_name or bucket_name in {".", ".."} or "/" in bucket_name or "\\" in bucket_name:
        raise ValueError("Invalid bucket name")
    return _resolve_under(cache_root, bucket_name)


def _safe_file_key_path(base: Path, file_key: str) -> Path:
    if not isinstance(file_key, str):
        raise TypeError("File key must be a string")
    file_path = Path(file_key)
    if file_path.is_absolute() or ".." in file_path.parts:
        raise ValueError("Invalid file path")
    return _resolve_under(base, file_path)


class AuthHandler(B2BaseHandler):
    """Authenticate with B2.

    POST /b2/api/v1/auth
        Body: ``{"key_id": "...", "app_key": "..."}``
        Falls back to ``B2_APPLICATION_KEY_ID`` / ``B2_APPLICATION_KEY`` env vars.
    """

    @web.authenticated
    def post(self) -> None:
        """Handle authentication request."""
        body = self.json_body()
        key_id = body.get("key_id") or os.environ.get("B2_APPLICATION_KEY_ID")
        app_key = body.get("app_key") or os.environ.get("B2_APPLICATION_KEY")

        if not key_id or not app_key:
            self.error("key_id and app_key are required", status=400)
            return

        try:
            api = set_b2_api(key_id, app_key)
            info = api.account_info
            self.success(
                data={
                    "account_id": info.get_account_id(),
                    "api_url": info.get_api_url(),
                    "s3_api_url": info.get_s3_api_url(),
                },
                message="Authenticated successfully",
            )
        except Exception as e:
            self.exception(e, status=401, message="Authentication failed.")


class StatusHandler(B2BaseHandler):
    """Check authentication status.

    GET /b2/api/v1/status
    """

    @web.authenticated
    def get(self) -> None:
        """Return current auth status."""
        if is_authenticated():
            api = get_b2_api()
            info = api.account_info
            self.success(
                data={
                    "authenticated": True,
                    "account_id": info.get_account_id(),
                    "api_url": info.get_api_url(),
                }
            )
        else:
            self.success(data={"authenticated": False})


class BucketsHandler(B2BaseHandler):
    """List all B2 buckets.

    GET /b2/api/v1/buckets
    """

    @web.authenticated
    def get(self) -> None:
        """List buckets."""
        try:
            api = get_b2_api()
            buckets = api.list_buckets()
            self.success(data=[{"name": b.name, "id": b.id_, "type": b.type_} for b in buckets])
        except Exception as e:
            self.exception(e)


class BucketInfoHandler(B2BaseHandler):
    """Get detailed bucket information including settings.

    GET /b2/api/v1/bucket-info?name=bucket-name
    """

    @web.authenticated
    def get(self) -> None:
        """Get bucket details."""
        name = self.get_argument("name", "")
        if not name:
            self.error("'name' query parameter is required")
            return

        try:
            api = get_b2_api()
            bucket = api.get_bucket_by_name(name)
            self.success(
                data={
                    "name": bucket.name,
                    "id": bucket.id_,
                    "type": bucket.type_,
                    "bucket_info": bucket.bucket_info or {},
                    "cors_rules": bucket.cors_rules or [],
                    "lifecycle_rules": [
                        {
                            "daysFromHidingToDeleting": getattr(
                                r, "days_from_hiding_to_deleting", None
                            ),
                            "daysFromUploadingToHiding": getattr(
                                r, "days_from_uploading_to_hiding", None
                            ),
                            "fileNamePrefix": getattr(r, "file_name_prefix", ""),
                        }
                        for r in (bucket.lifecycle_rules or [])
                    ],
                    "revision": bucket.revision,
                    "options": list(bucket.options_set) if bucket.options_set else [],
                    "default_server_side_encryption": str(bucket.default_server_side_encryption),
                    "default_retention": str(bucket.default_retention),
                    "is_file_lock_enabled": getattr(bucket, "is_file_lock_enabled", None),
                }
            )
        except Exception as e:
            self.exception(e)


class UpdateBucketHandler(B2BaseHandler):
    """Update bucket settings.

    POST /b2/api/v1/update-bucket
        Body: ``{"name": "bucket-name", "type": "allPrivate", ...}``
    """

    @web.authenticated
    def post(self) -> None:
        """Update bucket settings."""
        body = self.json_body()
        name = body.get("name", "")
        if not name:
            self.error("'name' is required")
            return

        try:
            api = get_b2_api()
            bucket = api.get_bucket_by_name(name)

            kwargs = {}
            if "type" in body:
                kwargs["bucket_type"] = body["type"]
            if "bucket_info" in body:
                kwargs["bucket_info"] = body["bucket_info"]

            if not kwargs:
                self.error("No update fields provided")
                return

            updated = bucket.update(**kwargs)
            self.success(
                data={
                    "name": updated.name,
                    "id": updated.id_,
                    "type": updated.type_,
                    "bucket_info": updated.bucket_info or {},
                }
            )
        except Exception as e:
            self.exception(e)


class ListFilesHandler(B2BaseHandler):
    """List files in a bucket/prefix.

    GET /b2/api/v1/ls?path=bucket/prefix&recursive=false
    """

    @web.authenticated
    def get(self) -> None:
        """List files."""
        path = self.get_argument("path", "")
        recursive = self.get_argument("recursive", "false").lower() == "true"

        if not path:
            self.error("'path' query parameter is required")
            return

        try:
            bucket_name, prefix = _parse_b2_path(path)
            api = get_b2_api()
            bucket = api.get_bucket_by_name(bucket_name)

            files = []
            for fv, _folder in bucket.ls(path=prefix, latest_only=True, recursive=recursive):
                files.append(
                    {
                        "name": fv.file_name,
                        "size": fv.size,
                        "upload_timestamp": fv.upload_timestamp,
                        "file_id": fv.id_,
                        "content_type": fv.content_type,
                        "action": getattr(fv, "action", "upload"),
                    }
                )

            self.success(data={"bucket": bucket_name, "prefix": prefix, "files": files})
        except Exception as e:
            self.exception(e)


class FileInfoHandler(B2BaseHandler):
    """Get file metadata.

    GET /b2/api/v1/info?path=bucket/file.csv
    """

    @web.authenticated
    def get(self) -> None:
        """Get file info."""
        path = self.get_argument("path", "")
        if not path:
            self.error("'path' query parameter is required")
            return

        try:
            bucket_name, file_key = _parse_b2_path(path)
            api = get_b2_api()
            bucket = api.get_bucket_by_name(bucket_name)
            fv = bucket.get_file_info_by_name(file_key)

            self.success(
                data={
                    "file_name": fv.file_name,
                    "size": fv.size,
                    "content_type": fv.content_type,
                    "upload_timestamp": fv.upload_timestamp,
                    "file_id": fv.id_,
                    "content_sha1": fv.content_sha1,
                    "action": getattr(fv, "action", "upload"),
                }
            )
        except Exception as e:
            self.exception(e)


class UploadHandler(B2BaseHandler):
    """Upload a local file to B2.

    POST /b2/api/v1/upload
        Body: ``{"local_path": "/path/to/file", "b2_path": "bucket/remote/file"}``
    """

    @web.authenticated
    def post(self) -> None:
        """Upload file."""
        body = self.json_body()
        local_path = body.get("local_path", "")
        b2_path = body.get("b2_path", "")

        if not local_path or not b2_path:
            self.error("'local_path' and 'b2_path' are required")
            return

        try:
            upload_root = Path(os.environ.get("JUPYTERLAB_B2_UPLOAD_ROOT", os.getcwd()))
            local = _resolve_under(upload_root, local_path)
        except (OSError, TypeError, ValueError):
            self.error("Local path is outside the allowed upload directory", status=400)
            return

        if not local.exists() or not local.is_file():
            self.error(f"Local file not found: {local_path}", status=404)
            return

        try:
            bucket_name, file_key = _parse_b2_path(b2_path)
            if not file_key:
                file_key = local.name

            api = get_b2_api()
            bucket = api.get_bucket_by_name(bucket_name)
            fv = bucket.upload_local_file(str(local), file_key)

            self.success(
                data={
                    "file_name": fv.file_name,
                    "file_id": fv.id_,
                    "size": local.stat().st_size,
                }
            )
        except Exception as e:
            self.exception(e)


class DownloadHandler(B2BaseHandler):
    """Download a file from B2 to local.

    POST /b2/api/v1/download
        Body: ``{"b2_path": "bucket/file.csv", "local_path": "./file.csv"}``
    """

    @web.authenticated
    def post(self) -> None:
        """Download file."""
        body = self.json_body()
        b2_path = body.get("b2_path", "")
        local_path = body.get("local_path", "")

        if not b2_path:
            self.error("'b2_path' is required")
            return

        try:
            bucket_name, file_key = _parse_b2_path(b2_path)
            if not local_path:
                local_path = file_key.split("/")[-1]
            download_root = Path(
                os.environ.get(
                    "JUPYTERLAB_B2_DOWNLOAD_ROOT",
                    Path(os.getcwd()) / "b2_downloads",
                )
            )
            target_path = _resolve_under(download_root, local_path)
            target_path.parent.mkdir(parents=True, exist_ok=True)

            api = get_b2_api()
            bucket = api.get_bucket_by_name(bucket_name)
            downloaded = bucket.download_file_by_name(file_key)
            downloaded.save_to(str(target_path))

            self.success(
                data={
                    "file_name": file_key,
                    "local_path": str(target_path),
                    "size": target_path.stat().st_size,
                }
            )
        except (OSError, TypeError, ValueError):
            self.error("Local path is outside the allowed download directory", status=400)
        except Exception as e:
            self.exception(e)


class LoadHandler(B2BaseHandler):
    """Load a file into memory (returns base64-encoded content).

    POST /b2/api/v1/load
        Body: ``{"path": "bucket/file.csv"}``
    """

    @web.authenticated
    def post(self) -> None:
        """Load file as base64."""
        body = self.json_body()
        path = body.get("path", "")

        if not path:
            self.error("'path' is required")
            return

        try:
            bucket_name, file_key = _parse_b2_path(path)
            api = get_b2_api()
            bucket = api.get_bucket_by_name(bucket_name)
            downloaded = bucket.download_file_by_name(file_key)
            buf = io.BytesIO()
            downloaded.save(buf)
            content = buf.getvalue()

            ct = downloaded.download_version.content_type
            # Fix generic content type using filename extension
            if not ct or ct == "application/octet-stream":
                guessed, _ = mimetypes.guess_type(file_key)
                ct = guessed or "application/octet-stream"

            self.success(
                data={
                    "file_name": file_key,
                    "size": len(content),
                    "content_base64": base64.b64encode(content).decode("ascii"),
                    "content_type": ct,
                }
            )
        except Exception as e:
            self.exception(e)


class PresignHandler(B2BaseHandler):
    """Generate a pre-signed download URL.

    POST /b2/api/v1/presign
        Body: ``{"path": "bucket/file.csv", "expires": 3600}``
    """

    @web.authenticated
    def post(self) -> None:
        """Generate pre-signed URL."""
        body = self.json_body()
        path = body.get("path", "")
        expires = body.get("expires", 3600)

        if not path:
            self.error("'path' is required")
            return

        try:
            bucket_name, file_key = _parse_b2_path(path)
            api = get_b2_api()
            bucket = api.get_bucket_by_name(bucket_name)
            auth_token = bucket.get_download_authorization(file_key, expires)
            base_url = api.account_info.get_download_url()
            url = f"{base_url}/file/{bucket_name}/{file_key}?Authorization={auth_token}"

            self.success(data={"url": url, "expires_in": expires})
        except Exception as e:
            self.exception(e)


class DeleteHandler(B2BaseHandler):
    """Delete a file from B2.

    POST /b2/api/v1/delete
        Body: ``{"path": "bucket/file.csv"}``
    """

    @web.authenticated
    def post(self) -> None:
        """Delete file."""
        body = self.json_body()
        path = body.get("path", "")

        if not path:
            self.error("'path' is required")
            return

        try:
            bucket_name, file_key = _parse_b2_path(path)
            api = get_b2_api()
            bucket = api.get_bucket_by_name(bucket_name)
            fv = bucket.get_file_info_by_name(file_key)
            api.delete_file_version(fv.id_, fv.file_name)
            self.success(message=f"Deleted {path}")
        except Exception as e:
            self.exception(e)


class OpenHandler(B2BaseHandler):
    """Download a file to a local cache and return the local path.

    This enables JupyterLab to open B2 files using its built-in viewers.

    POST /b2/api/v1/open
        Body: ``{"path": "bucket/file.csv"}``
    """

    @web.authenticated
    def post(self) -> None:
        """Download to cache and return local path."""
        body = self.json_body()
        path = body.get("path", "")

        if not path:
            self.error("'path' is required")
            return

        try:
            bucket_name, file_key = _parse_b2_path(path)
            file_name = file_key.split("/")[-1]

            cache_root = Path(".b2-cache").resolve()
            cache_dir = _safe_bucket_cache_dir(cache_root, bucket_name)
            cache_dir.mkdir(parents=True, exist_ok=True)

            # Preserve subdirectory structure
            local_path = _safe_file_key_path(cache_dir, file_key)
            local_path.parent.mkdir(parents=True, exist_ok=True)

            api = get_b2_api()
            bucket = api.get_bucket_by_name(bucket_name)
            downloaded = bucket.download_file_by_name(file_key)
            downloaded.save_to(str(local_path))

            # Return path relative to Jupyter root for docmanager:open.
            rel_path = local_path.relative_to(Path.cwd().resolve()).as_posix()

            self.success(
                data={
                    "local_path": rel_path,
                    "file_name": file_name,
                    "size": local_path.stat().st_size,
                }
            )
        except (OSError, TypeError, ValueError):
            self.error("B2 file path is outside the allowed cache directory", status=400)
        except Exception as e:
            self.exception(e)


class CreateBucketHandler(B2BaseHandler):
    """Create a new B2 bucket.

    POST /b2/api/v1/create-bucket
        Body: ``{"name": "my-new-bucket", "type": "allPrivate"}``
    """

    @web.authenticated
    def post(self) -> None:
        """Create bucket."""
        body = self.json_body()
        name = body.get("name", "")
        bucket_type = body.get("type", "allPrivate")

        if not name:
            self.error("'name' is required")
            return

        try:
            api = get_b2_api()
            bucket = api.create_bucket(name, bucket_type)
            self.success(
                data={
                    "name": bucket.name,
                    "id": bucket.id_,
                    "type": bucket.type_,
                }
            )
        except Exception as e:
            self.exception(e)


class UploadBytesHandler(B2BaseHandler):
    """Upload base64-encoded content to B2.

    POST /b2/api/v1/upload-bytes
        Body: ``{"b2_path": "...", "content_base64": "...", "content_type": "..."}``
    """

    @web.authenticated
    def post(self) -> None:
        """Upload bytes."""
        body = self.json_body()
        b2_path = body.get("b2_path", "")
        content_b64 = body.get("content_base64", "")
        content_type = body.get("content_type", "")

        if not b2_path or not content_b64:
            self.error("'b2_path' and 'content_base64' are required")
            return

        try:
            bucket_name, file_key = _parse_b2_path(b2_path)
            data = base64.b64decode(content_b64)

            # Auto-detect content type from filename if not provided or generic
            if not content_type or content_type == "application/octet-stream":
                guessed, _ = mimetypes.guess_type(file_key)
                content_type = guessed or "application/octet-stream"

            api = get_b2_api()
            bucket = api.get_bucket_by_name(bucket_name)
            fv = bucket.upload_bytes(data, file_key, content_type=content_type)

            self.success(
                data={
                    "file_name": fv.file_name,
                    "file_id": fv.id_,
                    "size": len(data),
                }
            )
        except Exception as e:
            self.exception(e)


class RenameHandler(B2BaseHandler):
    """Rename a file in B2 (copy to new name + delete old).

    POST /b2/api/v1/rename
        Body: ``{"old_path": "bucket/old.csv", "new_path": "bucket/new.csv"}``

    B2 doesn't support native rename, so this copies the file to the
    new key and deletes the original.
    """

    @web.authenticated
    def post(self) -> None:
        """Rename by copy + delete."""
        body = self.json_body()
        old_path = body.get("old_path", "")
        new_path = body.get("new_path", "")

        if not old_path or not new_path:
            self.error("'old_path' and 'new_path' are required")
            return

        try:
            api = get_b2_api()
            old_bucket_name, old_key = _parse_b2_path(old_path)
            new_bucket_name, new_key = _parse_b2_path(new_path)

            old_bucket = api.get_bucket_by_name(old_bucket_name)
            old_fv = old_bucket.get_file_info_by_name(old_key)

            # Copy to new location
            new_bucket = api.get_bucket_by_name(new_bucket_name)
            new_bucket.copy(old_fv.id_, new_key)

            # Delete old file
            api.delete_file_version(old_fv.id_, old_fv.file_name)

            # Return info about the new file
            new_fv = new_bucket.get_file_info_by_name(new_key)
            self.success(
                {
                    "file_name": new_fv.file_name,
                    "size": new_fv.size,
                    "content_type": new_fv.content_type,
                    "upload_timestamp": new_fv.upload_timestamp,
                }
            )
        except Exception as e:
            self.exception(e)


class DeleteBucketHandler(B2BaseHandler):
    """Delete an empty B2 bucket.

    POST /b2/api/v1/delete-bucket
        Body: ``{"name": "bucket-name"}``
    """

    @web.authenticated
    def post(self) -> None:
        """Delete bucket by name."""
        body = self.json_body()
        name = body.get("name", "")

        if not name:
            self.error("'name' is required")
            return

        try:
            api = get_b2_api()
            bucket = api.get_bucket_by_name(name)
            api.delete_bucket(bucket)
            self.success(message=f"Deleted bucket '{name}'")
        except Exception as e:
            self.exception(e)
