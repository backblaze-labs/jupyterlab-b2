# CLAUDE.md — jupyterlab-b2

## Project Overview

**jupyterlab-b2** is a JupyterLab 4 extension that provides a native sidebar file browser for Backblaze B2 Cloud Storage. It registers a `Contents.IDrive` named `"b2"` with JupyterLab's ContentsManager, so the built-in FileBrowser works natively with B2 — same breadcrumbs, drag-and-drop upload, right-click menus, and file viewer integration.

The extension has two layers:

1. **Python server extension** — REST API handlers (`/b2/api/v1/`) using Tornado + b2sdk
2. **TypeScript frontend** — JupyterLab plugin that implements `Contents.IDrive` and creates the sidebar

## Repository Structure

```
jupyterlab-b2/
├── jupyterlab_b2/                     # Python server extension
│   ├── __init__.py              # Extension registration entry points
│   ├── _version.py              # Version from package.json
│   ├── handlers/
│   │   ├── base.py              # B2BaseHandler, auth management (get_b2_api, set_b2_api)
│   │   ├── b2_handlers.py       # REST API handlers (auth, ls, upload, download, etc.)
│   │   └── routes.py            # Route registration with Jupyter Server
│   └── tests/
│       └── test_handlers.py     # pytest test suite
├── src/                         # TypeScript frontend
│   ├── index.ts                 # Main plugin — sidebar browser, commands, toolbar
│   ├── drive.ts                 # B2Drive: Contents.IDrive implementation
│   ├── api.ts                   # B2Api namespace — typed REST client
│   └── widget.ts                # (unused, kept for future custom widgets)
├── style/
│   └── base.css                 # Sidebar styles, bucket icons, context menu filtering
├── pyproject.toml               # Python build config (hatchling + hatch-nodejs-version)
├── package.json                 # Node build config (jupyterlab-extension)
├── tsconfig.json                # TypeScript config
├── webpack.config.js            # Webpack for frontend bundling
└── jupyter-config/              # Auto-enable server extension config
```

## Key Architecture Decisions

- **Contents.IDrive** — uses JupyterLab's native drive interface so the built-in FileBrowser works without custom widgets
- **Server extension REST API** — all B2 operations go through `/b2/api/v1/` endpoints; the TypeScript frontend never talks to B2 directly
- **Auto-auth from B2 CLI** — piggybacks on `SqliteAccountInfo` from `~/.b2_account_info` so users who already use the B2 CLI don't need to re-authenticate
- **Mimetype correction** — both server and client fix `application/octet-stream` to correct types based on file extension (B2 doesn't always detect mimetype on upload)
- **Virtual folder tree** — B2 has flat key namespaces; the drive parses `/` separators into a folder tree for the file browser

## Development Commands

```bash
# Install in development mode
pip install -e ".[dev]"
jlpm install
jlpm build

# Rebuild TypeScript after changes
jlpm build

# Run Python tests
pytest jupyterlab_b2/tests/ -v

# Lint Python code
ruff check jupyterlab_b2/
ruff format --check jupyterlab_b2/

# Watch mode for TypeScript development
jlpm watch
# (in another terminal)
jupyter lab --no-browser
```

## Continuous Integration

CI (`.github/workflows/ci.yml`) runs on pushes to `main` and PRs targeting
`main`: `lint` (ruff), `ts-lint` (eslint + prettier), `test` (pytest across the
OS/Python matrix), and `build`.

**Dependabot PRs never run CI.** Every job is gated on
`github.event.pull_request.user.login != 'dependabot[bot]' && !startsWith(github.head_ref, 'dependabot/')`
(the `build` job also keeps `success()`), so dependency-bump PRs show all checks
as skipped. Merge them manually or via auto-merge; the post-merge push to `main`
runs the full suite.

## Code Conventions

- Python 3.10+ required
- `from __future__ import annotations` in every Python module
- numpy docstring style (enforced by ruff D rules)
- TypeScript strict mode
- `B2BaseHandler` for all REST handlers — provides `json_body()`, `success()`, `error()`
- All B2 operations use `b2sdk.v3` API
- Bucket.ls uses `path=` parameter (not `folder_to_list=`)
- `authorize_account(key_id, app_key, realm="production")` — key_id first, NOT realm first

## REST API Endpoints

All at `/b2/api/v1/`:

| Method | Endpoint                     | Handler             |
| ------ | ---------------------------- | ------------------- |
| POST   | `/auth`                      | AuthHandler         |
| GET    | `/status`                    | StatusHandler       |
| GET    | `/buckets`                   | BucketsHandler      |
| GET    | `/bucket-info?name=X`        | BucketInfoHandler   |
| POST   | `/update-bucket`             | UpdateBucketHandler |
| POST   | `/create-bucket`             | CreateBucketHandler |
| POST   | `/delete-bucket`             | DeleteBucketHandler |
| GET    | `/ls?path=X&recursive=false` | ListFilesHandler    |
| GET    | `/info?path=X`               | FileInfoHandler     |
| POST   | `/upload`                    | UploadHandler       |
| POST   | `/upload-bytes`              | UploadBytesHandler  |
| POST   | `/download`                  | DownloadHandler     |
| POST   | `/load`                      | LoadHandler         |
| POST   | `/presign`                   | PresignHandler      |
| POST   | `/delete`                    | DeleteHandler       |
| POST   | `/open`                      | OpenHandler         |
| POST   | `/rename`                    | RenameHandler       |

## Important Gotchas

- B2 has no native rename — rename is implemented as copy + delete
- B2 has no real folders — keys with `/` are parsed into virtual folders client-side
- Buckets cannot be renamed — delete old + create new with desired name
- `application/octet-stream` is the default content type for many uploads; always correct it from file extension using `mimetypes.guess_type()`
- The `file_size` column is hidden by default in JupyterLab's DirListing — must call `listing.setColumnVisibility('file_size', true)` on our browser
- Drag-and-drop uploads send content as `format: 'base64'` — do NOT double-encode
- Selected bucket icons need white SVG variant (CSS `jp-mod-selected` changes text to white)
