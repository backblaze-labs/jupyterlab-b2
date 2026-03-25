# jupyterlab-b2

[![Python](https://img.shields.io/pypi/pyversions/jupyterlab-b2.svg)](https://pypi.org/project/jupyterlab-b2/)
[![License](https://img.shields.io/pypi/l/jupyterlab-b2.svg)](https://github.com/goanpeca/jupyterlab-b2/blob/main/LICENSE.txt)

**JupyterLab extension for Backblaze B2 Cloud Storage** — a native sidebar file browser that uses JupyterLab's built-in `Contents.IDrive` interface. Same look, same breadcrumbs, same drag-and-drop — but backed by B2.

## Features

- **Native file browser** — registers as a JupyterLab drive, so the built-in FileBrowser works with B2 out of the box
- **Drag-and-drop upload** — drop files from your desktop into B2 buckets with progress indication
- **Click to open** — images, Python files, notebooks, CSVs all open in JupyterLab's built-in viewers
- **Bucket management** — create, delete, and configure buckets (visibility, custom info, lifecycle rules)
- **File operations** — rename (copy+delete), delete, download files
- **Smart mimetype detection** — auto-corrects `application/octet-stream` to the right type
- **Bucket icons** — root-level items show bucket icons; folders show standard folder icons
- **Upload indicator** — pulsing status banner shows upload progress
- **Context menus** — "New Bucket" at root, "Delete" and "Rename" inside buckets
- **Bucket Settings dialog** — right-click a bucket to view/edit visibility, custom info, lifecycle rules
- **Auto-authentication** — from env vars, B2 CLI stored credentials, or interactive prompt
- **Dark mode** — respects JupyterLab theme via CSS custom properties
- **REST API** — server extension exposes `/b2/api/v1/` endpoints for programmatic access

## Quick Start

```bash
pip install jupyterlab-b2
```

Set your B2 credentials:

```bash
export B2_APPLICATION_KEY_ID="your-key-id"
export B2_APPLICATION_KEY="your-app-key"
```

Launch JupyterLab — the B2 panel appears in the left sidebar with the Backblaze flame icon.

### Authentication

Three methods (in priority order):

1. **Environment variables** (recommended):

   ```bash
   export B2_APPLICATION_KEY_ID="your-key-id"
   export B2_APPLICATION_KEY="your-app-key"
   ```

2. **B2 CLI stored credentials** — if you've run `b2 authorize-account` before, credentials are auto-discovered from `~/.b2_account_info`

3. **REST API** — `POST /b2/api/v1/auth` with `{"key_id": "...", "app_key": "..."}`

## Development

### Prerequisites

- Python 3.10+
- Node.js 20+
- JupyterLab 4.x

### Setup

```bash
# Clone
git clone https://github.com/backblaze-b2-samples/jupyterlab-b2.git
cd jupyterlab-b2

# Install Python package in dev mode
pip install -e ".[dev]"

# Install JS dependencies
jlpm install

# Build the TypeScript frontend
jlpm build

# Link the extension for development
jupyter labextension develop --overwrite .

# Enable server extension
jupyter server extension enable jupyterlab_b2
```

### Development workflow

```bash
# Terminal 1: Watch TypeScript changes
jlpm watch

# Terminal 2: Run JupyterLab (auto-reloads frontend)
jupyter lab --autoreload
```

### Testing

```bash
# Python tests
pytest jupyterlab_b2/tests/ -v

# With coverage
pytest jupyterlab_b2/tests/ -v --cov=jupyterlab_b2 --cov-report=term-missing

# Lint Python
ruff check jupyterlab_b2/
ruff format --check jupyterlab_b2/

# Lint TypeScript
jlpm lint:check
```

## REST API

All endpoints at `/b2/api/v1/`:

| Method | Endpoint                 | Description                                                            |
| ------ | ------------------------ | ---------------------------------------------------------------------- |
| POST   | `/auth`                  | Authenticate (`{"key_id": "...", "app_key": "..."}`)                   |
| GET    | `/status`                | Check auth status                                                      |
| GET    | `/buckets`               | List all buckets                                                       |
| GET    | `/bucket-info?name=X`    | Detailed bucket info (settings, lifecycle, encryption)                 |
| POST   | `/update-bucket`         | Update bucket settings (`{"name": "X", "type": "allPrivate"}`)         |
| POST   | `/create-bucket`         | Create bucket (`{"name": "X", "type": "allPrivate"}`)                  |
| POST   | `/delete-bucket`         | Delete empty bucket (`{"name": "X"}`)                                  |
| GET    | `/ls?path=bucket/prefix` | List files (supports `&recursive=true`)                                |
| GET    | `/info?path=bucket/file` | File metadata                                                          |
| POST   | `/upload`                | Upload local file (`{"local_path": "...", "b2_path": "..."}`)          |
| POST   | `/upload-bytes`          | Upload base64 content (`{"b2_path": "...", "content_base64": "..."}`)  |
| POST   | `/download`              | Download to local (`{"b2_path": "...", "local_path": "..."}`)          |
| POST   | `/load`                  | Load file as base64 (`{"path": "..."}`)                                |
| POST   | `/presign`               | Pre-signed URL (`{"path": "...", "expires": 3600}`)                    |
| POST   | `/delete`                | Delete file (`{"path": "..."}`)                                        |
| POST   | `/rename`                | Rename file via copy+delete (`{"old_path": "...", "new_path": "..."}`) |
| POST   | `/open`                  | Download to temp cache for JupyterLab viewer                           |

## Architecture

```
jupyterlab-b2/
├── jupyterlab_b2/                     # Python server extension
│   ├── __init__.py              # Extension registration entry points
│   ├── handlers/
│   │   ├── base.py              # B2BaseHandler, auth management
│   │   ├── b2_handlers.py       # REST API handlers (16 endpoints)
│   │   └── routes.py            # Route registration
│   └── tests/
│       └── test_handlers.py     # pytest test suite
├── src/                         # TypeScript frontend
│   ├── index.ts                 # Plugin — sidebar browser, commands, toolbar
│   ├── drive.ts                 # B2Drive: Contents.IDrive implementation
│   ├── api.ts                   # B2Api namespace — typed REST client
│   └── widget.ts                # (reserved for future custom widgets)
├── style/
│   └── base.css                 # Bucket icons, context menu filtering, upload status
├── pyproject.toml               # Python build (hatchling + hatch-nodejs-version)
├── package.json                 # Node build (jupyterlab-extension)
└── CLAUDE.md                    # AI assistant project context
```

### How the Drive Works

1. `B2Drive` implements JupyterLab's `Contents.IDrive` interface
2. It's registered with `ContentsManager` as the `"b2"` drive
3. JupyterLab's native `FileBrowser` is created with this drive
4. All file operations (`get`, `save`, `rename`, `delete`) go through the drive
5. The drive calls our Python server extension REST API
6. The server extension uses `b2sdk.v3` to talk to B2

### Key Design Decisions

- **No custom file browser widget** — we use JupyterLab's built-in `FileBrowser` via the `Contents.IDrive` interface
- **Mimetype correction on both sides** — server uses `mimetypes.guess_type()`, client has an extension→mimetype map
- **B2 rename = copy + delete** — B2 has no native rename; we implement it as server-side copy then delete
- **Upload status via custom signal** — `B2Drive.uploadStatus` signal since JupyterLab's built-in upload tracking doesn't fire for custom drives

## Companion Package

Use **[b2-jupyter](https://github.com/backblaze-b2-samples/b2-jupyter)** for IPython magic commands (`%b2 ls`, `%b2_load`, `%%b2_save`) and fsspec `b2://` protocol integration.

## Requirements

- Python 3.10+
- JupyterLab 4.x
- b2sdk 2.0+
- Node.js 20+ (for development only)

## License

MIT License. See [LICENSE.txt](LICENSE.txt) for details.
