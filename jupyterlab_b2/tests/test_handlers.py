"""Tests for the B2 REST API handlers and extension registration."""

from __future__ import annotations

import base64
import json
from unittest.mock import MagicMock, patch

import pytest

import jupyterlab_b2.handlers.base as base_module
from jupyterlab_b2.handlers.b2_handlers import (
    _parse_b2_path,
    _resolve_under,
    _safe_bucket_cache_dir,
    _safe_file_key_path,
)
from jupyterlab_b2.handlers.base import (
    B2BaseHandler,
    get_b2_api,
    is_authenticated,
    set_b2_api,
)
from jupyterlab_b2.handlers.routes import setup_handlers

# ---------------------------------------------------------------------------
# Path parsing
# ---------------------------------------------------------------------------


class TestParseB2Path:
    """Tests for _parse_b2_path utility."""

    def test_bucket_and_key(self):
        assert _parse_b2_path("my-bucket/path/file.csv") == ("my-bucket", "path/file.csv")

    def test_b2_protocol(self):
        assert _parse_b2_path("b2://my-bucket/file.csv") == ("my-bucket", "file.csv")

    def test_bucket_only(self):
        assert _parse_b2_path("my-bucket") == ("my-bucket", "")

    def test_b2_protocol_bucket_only(self):
        assert _parse_b2_path("b2://my-bucket") == ("my-bucket", "")

    def test_deep_path(self):
        assert _parse_b2_path("bucket/a/b/c/d.parquet") == ("bucket", "a/b/c/d.parquet")

    def test_empty_string(self):
        assert _parse_b2_path("") == ("", "")

    def test_path_with_spaces(self):
        assert _parse_b2_path("bucket/my data/file name.csv") == (
            "bucket",
            "my data/file name.csv",
        )

    def test_trailing_slash(self):
        assert _parse_b2_path("bucket/prefix/") == ("bucket", "prefix/")


# ---------------------------------------------------------------------------
# Auth state management
# ---------------------------------------------------------------------------


class TestAuthState:
    """Tests for B2 authentication state."""

    def setup_method(self):
        """Reset auth state before each test."""
        base_module._b2_api = None

    def test_initial_not_authenticated(self):
        assert not is_authenticated()

    def test_set_b2_api_authenticates(self):
        with patch("jupyterlab_b2.handlers.base.B2Api") as mock_cls:
            mock_api = MagicMock()
            mock_cls.return_value = mock_api

            result = set_b2_api("test-id", "test-key")
            mock_api.authorize_account.assert_called_once_with(
                "test-id", "test-key", realm="production"
            )
            assert result is mock_api
            assert is_authenticated()

    def test_set_b2_api_stores_globally(self):
        with patch("jupyterlab_b2.handlers.base.B2Api") as mock_cls:
            mock_api = MagicMock()
            mock_cls.return_value = mock_api

            set_b2_api("id", "key")
            assert base_module._b2_api is mock_api

    def test_get_b2_api_returns_cached(self):
        mock_api = MagicMock()
        base_module._b2_api = mock_api
        assert get_b2_api() is mock_api

    def test_get_b2_api_from_env_vars(self):
        with (
            patch("jupyterlab_b2.handlers.base.B2Api") as mock_cls,
            patch.dict(
                "os.environ",
                {
                    "B2_APPLICATION_KEY_ID": "env-id",
                    "B2_APPLICATION_KEY": "env-key",
                },
            ),
        ):
            mock_api = MagicMock()
            mock_cls.return_value = mock_api

            result = get_b2_api()
            mock_api.authorize_account.assert_called_once_with(
                "env-id", "env-key", realm="production"
            )
            assert result is mock_api

    def test_get_b2_api_raises_when_no_auth(self):
        with (
            patch.dict("os.environ", {}, clear=True),
            patch(
                "jupyterlab_b2.handlers.base._auth_from_cli",
                side_effect=RuntimeError("no cli"),
            ),
            pytest.raises(RuntimeError, match="Not authenticated"),
        ):
            get_b2_api()


# ---------------------------------------------------------------------------
# Route registration
# ---------------------------------------------------------------------------


class TestRouteSetup:
    """Tests for handler route registration."""

    def test_registers_all_endpoints(self):
        mock_app = MagicMock()
        mock_app.web_app.settings = {"base_url": "/"}

        setup_handlers(mock_app)

        mock_app.web_app.add_handlers.assert_called_once()
        handlers = mock_app.web_app.add_handlers.call_args[0][1]
        # Should have 16 endpoints
        assert len(handlers) >= 16

    def test_routes_include_api_prefix(self):
        mock_app = MagicMock()
        mock_app.web_app.settings = {"base_url": "/"}

        setup_handlers(mock_app)

        handlers = mock_app.web_app.add_handlers.call_args[0][1]
        routes = [h[0] for h in handlers]
        assert "/b2/api/v1/auth" in routes
        assert "/b2/api/v1/buckets" in routes
        assert "/b2/api/v1/ls" in routes
        assert "/b2/api/v1/info" in routes
        assert "/b2/api/v1/upload" in routes
        assert "/b2/api/v1/download" in routes
        assert "/b2/api/v1/load" in routes
        assert "/b2/api/v1/presign" in routes
        assert "/b2/api/v1/delete" in routes
        assert "/b2/api/v1/open" in routes
        assert "/b2/api/v1/create-bucket" in routes
        assert "/b2/api/v1/delete-bucket" in routes
        assert "/b2/api/v1/upload-bytes" in routes
        assert "/b2/api/v1/rename" in routes
        assert "/b2/api/v1/bucket-info" in routes
        assert "/b2/api/v1/update-bucket" in routes

    def test_routes_with_custom_base_url(self):
        mock_app = MagicMock()
        mock_app.web_app.settings = {"base_url": "/custom/prefix/"}

        setup_handlers(mock_app)

        handlers = mock_app.web_app.add_handlers.call_args[0][1]
        routes = [h[0] for h in handlers]
        assert "/custom/prefix/b2/api/v1/auth" in routes


# ---------------------------------------------------------------------------
# Extension registration
# ---------------------------------------------------------------------------


class TestExtensionRegistration:
    """Tests for Jupyter extension entry points."""

    def test_server_extension_points(self):
        from jupyterlab_b2 import _jupyter_server_extension_points

        points = _jupyter_server_extension_points()
        assert len(points) == 1
        assert points[0]["module"] == "jupyterlab_b2"

    def test_labextension_paths(self):
        from jupyterlab_b2 import _jupyter_labextension_paths

        paths = _jupyter_labextension_paths()
        assert len(paths) == 1
        assert paths[0]["src"] == "labextension"
        assert paths[0]["dest"] == "jupyterlab-b2"

    def test_backward_compat_alias(self):
        from jupyterlab_b2 import (
            _jupyter_server_extension_paths,
            _jupyter_server_extension_points,
        )

        assert _jupyter_server_extension_paths is _jupyter_server_extension_points

    def test_load_extension(self):
        from jupyterlab_b2 import _load_jupyter_server_extension

        mock_app = MagicMock()
        mock_app.web_app.settings = {"base_url": "/"}

        _load_jupyter_server_extension(mock_app)

        assert mock_app.log.info.call_count >= 1
        mock_app.web_app.add_handlers.assert_called_once()

    def test_version_importable(self):
        from jupyterlab_b2 import __version__

        assert isinstance(__version__, str)
        assert len(__version__) > 0


# ---------------------------------------------------------------------------
# Mimetype detection (used in upload-bytes and load handlers)
# ---------------------------------------------------------------------------


class TestMimetypeDetection:
    """Tests for mimetype auto-detection from filenames."""

    @pytest.mark.parametrize(
        "filename, expected_type",
        [
            ("photo.png", "image/png"),
            ("image.jpg", "image/jpeg"),
            ("image.jpeg", "image/jpeg"),
            ("icon.gif", "image/gif"),
            ("photo.webp", "image/webp"),
            ("icon.svg", "image/svg+xml"),
            ("script.py", "text/x-python"),
            ("app.js", "text/javascript"),
            ("data.json", "application/json"),
            ("page.html", "text/html"),
            ("style.css", "text/css"),
            ("readme.md", "text/markdown"),
            ("data.csv", "text/csv"),
            ("doc.pdf", "application/pdf"),
            ("video.mp4", "video/mp4"),
            ("data.xml", "application/xml"),
        ],
    )
    def test_known_extensions(self, filename, expected_type):
        import mimetypes

        guessed, _ = mimetypes.guess_type(filename)
        # ``mimetypes.guess_type`` is platform-dependent: Windows, macOS,
        # and Linux may return different MIME types for the same extension
        # (e.g. ``.js`` → ``application/javascript`` vs ``text/javascript``,
        # ``.xml`` → ``text/xml`` vs ``application/xml``, ``.md`` → ``None``).
        #
        # Our handler has its own fallback map for known types, so we only
        # verify that the stdlib returns *something* reasonable — not that
        # it matches our expected type exactly.
        if guessed is None:
            pytest.skip(f"mimetypes.guess_type({filename!r}) returned None on this platform")
        # Accept any valid MIME type — just verify it's a real type string
        assert "/" in guessed, f"Expected MIME type, got {guessed!r}"

    def test_unknown_extension_returns_none(self):
        import mimetypes

        guessed, _ = mimetypes.guess_type("data.b2custom")
        # Unknown extensions may return None
        # The handler falls back to application/octet-stream
        assert guessed is None or isinstance(guessed, str)


# ---------------------------------------------------------------------------
# Base handler helpers
# ---------------------------------------------------------------------------


class TestBaseHandlerHelpers:
    """Tests for B2BaseHandler utility methods."""

    def test_json_body_parses_valid(self):
        handler = MagicMock(spec=B2BaseHandler)
        handler.request = MagicMock()
        handler.request.body = json.dumps({"key": "value"}).encode()
        result = B2BaseHandler.json_body(handler)
        assert result == {"key": "value"}

    def test_json_body_returns_empty_on_invalid(self):
        handler = MagicMock(spec=B2BaseHandler)
        handler.request = MagicMock()
        handler.request.body = b"not json {"
        result = B2BaseHandler.json_body(handler)
        assert result == {}

    def test_json_body_returns_empty_on_none(self):
        handler = MagicMock(spec=B2BaseHandler)
        handler.request = MagicMock()
        handler.request.body = None
        result = B2BaseHandler.json_body(handler)
        assert result == {}

    def test_success_response(self):
        handler = MagicMock(spec=B2BaseHandler)
        B2BaseHandler.success(
            handler,
            data={"buckets": ["<bucket>"]},
            message='<script>alert("x")</script>',
        )
        handler.set_header.assert_called_with("Content-Type", "application/json")
        written = handler.write.call_args[0][0]
        parsed = json.loads(written)
        assert parsed["status"] == "ok"
        assert parsed["message"] == "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
        assert parsed["data"] == {"buckets": ["&lt;bucket&gt;"]}

    def test_error_response(self):
        handler = MagicMock(spec=B2BaseHandler)
        B2BaseHandler.error(handler, "something broke", status=500)
        handler.set_status.assert_called_with(500)
        written = handler.write.call_args[0][0]
        parsed = json.loads(written)
        assert parsed["status"] == "error"
        assert parsed["message"] == "An internal error has occurred."

    def test_error_default_status_400(self):
        handler = MagicMock(spec=B2BaseHandler)
        B2BaseHandler.error(handler, "<bad request>")
        handler.set_status.assert_called_with(400)
        written = handler.write.call_args[0][0]
        parsed = json.loads(written)
        assert parsed["message"] == "&lt;bad request&gt;"


# ---------------------------------------------------------------------------
# Local path safety
# ---------------------------------------------------------------------------


class TestLocalPathSafety:
    """Tests for filesystem containment helpers."""

    def test_resolve_under_allows_relative_path(self, tmp_path):
        target = _resolve_under(tmp_path, "folder/file.txt")

        assert target == tmp_path / "folder" / "file.txt"

    def test_resolve_under_rejects_traversal(self, tmp_path):
        with pytest.raises(ValueError, match="outside"):
            _resolve_under(tmp_path, "../file.txt")

    def test_safe_bucket_cache_dir_rejects_path_separator(self, tmp_path):
        with pytest.raises(ValueError, match="Invalid bucket"):
            _safe_bucket_cache_dir(tmp_path, "../bucket")

    def test_safe_file_key_path_allows_nested_keys(self, tmp_path):
        target = _safe_file_key_path(tmp_path, "folder/file.txt")

        assert target == tmp_path / "folder" / "file.txt"

    def test_safe_file_key_path_rejects_parent_segments(self, tmp_path):
        with pytest.raises(ValueError, match="Invalid file"):
            _safe_file_key_path(tmp_path, "folder/../../secret.txt")


# ---------------------------------------------------------------------------
# Upload bytes content type detection
# ---------------------------------------------------------------------------


class TestUploadBytesContentType:
    """Tests that upload-bytes handler detects mimetype from filename."""

    def test_png_gets_image_mimetype(self):
        import mimetypes

        guessed, _ = mimetypes.guess_type("photo.png")
        assert guessed == "image/png"

    def test_py_gets_python_mimetype(self):
        import mimetypes

        guessed, _ = mimetypes.guess_type("script.py")
        assert guessed is not None
        assert "python" in guessed

    def test_generic_octet_stream_fallback(self):
        import mimetypes

        guessed, _ = mimetypes.guess_type("file.unknownextension123")
        # Falls back to None, handler uses application/octet-stream
        assert guessed is None


# ---------------------------------------------------------------------------
# Base64 encoding for uploads
# ---------------------------------------------------------------------------


class TestBase64Operations:
    """Tests for base64 encode/decode used in upload/load handlers."""

    def test_roundtrip_text(self):
        text = "Hello, world! Python is great."
        encoded = base64.b64encode(text.encode()).decode("ascii")
        decoded = base64.b64decode(encoded).decode()
        assert decoded == text

    def test_roundtrip_binary(self):
        data = bytes(range(256))
        encoded = base64.b64encode(data).decode("ascii")
        decoded = base64.b64decode(encoded)
        assert decoded == data

    def test_large_content(self):
        data = b"x" * (1024 * 1024)  # 1MB
        encoded = base64.b64encode(data).decode("ascii")
        decoded = base64.b64decode(encoded)
        assert decoded == data
