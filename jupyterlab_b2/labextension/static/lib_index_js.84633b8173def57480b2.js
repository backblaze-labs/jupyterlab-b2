"use strict";
(self["webpackChunkjupyterlab_b2"] = self["webpackChunkjupyterlab_b2"] || []).push([["lib_index_js"],{

/***/ "./lib/api.js"
/*!********************!*\
  !*** ./lib/api.js ***!
  \********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   B2Api: () => (/* binding */ B2Api)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__);
/**
 * @module api
 *
 * Typed HTTP client for the jupyterlab-b2 server extension REST API.
 *
 * All public functions in the {@link B2Api} namespace are thin wrappers
 * around the endpoints exposed by `jupyterlab_b2.handlers`. They handle
 * serialisation, error mapping, and return strongly typed responses.
 *
 * @example
 * ```ts
 * import { B2Api, IB2File } from './api';
 *
 * const buckets = await B2Api.listBuckets();
 * const files = await B2Api.listFiles('my-bucket/', true);
 * ```
 */


// ────────────────────────────────────────────────────────────────────
// Transport
// ────────────────────────────────────────────────────────────────────
/** Base path for all B2 server extension endpoints. */
const API_PREFIX = '/b2/api/v1';
/**
 * Issue a typed HTTP request against the B2 server extension.
 *
 * @typeParam T - Expected shape of the response `data` field.
 * @param method  - HTTP method (`GET`, `POST`, etc.).
 * @param endpoint - Endpoint path relative to {@link API_PREFIX}.
 * @param body - JSON body (ignored for `GET`).
 * @param queryParams - URL query parameters.
 * @returns The `data` field of the response envelope.
 * @throws {Error} On non-2xx status or `status: "error"` in the envelope.
 *
 * @internal
 */
async function b2Request(method, endpoint, body, queryParams) {
    const settings = _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeSettings();
    let url = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(settings.baseUrl, API_PREFIX, endpoint);
    if (queryParams) {
        const params = new URLSearchParams(queryParams);
        url += '?' + params.toString();
    }
    const init = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body && method !== 'GET') {
        init.body = JSON.stringify(body);
    }
    const response = await _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeRequest(url, init, settings);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`B2 API error (${response.status}): ${text}`);
    }
    const json = (await response.json());
    if (json.status === 'error') {
        throw new Error(json.message);
    }
    return json.data;
}
// ────────────────────────────────────────────────────────────────────
// Public API namespace
// ────────────────────────────────────────────────────────────────────
/**
 * Client for the jupyterlab-b2 server extension REST API.
 *
 * Every function maps 1-to-1 to a server handler and returns a typed
 * promise.  All calls go through {@link b2Request} which handles
 * authentication headers, error unwrapping, and JSON parsing.
 *
 * @example
 * ```ts
 * const buckets = await B2Api.listBuckets();
 * console.log(buckets.map(b => b.name));
 * ```
 */
var B2Api;
(function (B2Api) {
    /**
     * Authenticate with B2 using explicit application key credentials.
     *
     * @param keyId - B2 Application Key ID.
     * @param appKey - B2 Application Key (secret).
     * @returns Account and API URL information.
     */
    async function auth(keyId, appKey) {
        return b2Request('POST', '/auth', { key_id: keyId, app_key: appKey });
    }
    B2Api.auth = auth;
    /**
     * Check whether the server extension is authenticated with B2.
     *
     * @returns Current authentication status.
     */
    async function status() {
        return b2Request('GET', '/status');
    }
    B2Api.status = status;
    /**
     * List all buckets visible to the authenticated account.
     *
     * @returns Array of bucket metadata objects.
     */
    async function listBuckets() {
        return b2Request('GET', '/buckets');
    }
    B2Api.listBuckets = listBuckets;
    /**
     * List files under a bucket and optional key prefix.
     *
     * @param path - Path in the form `bucket/prefix/`.
     * @param recursive - When `true`, list all descendant files.
     * @returns Listing result with bucket, prefix, and file array.
     */
    async function listFiles(path, recursive = false) {
        return b2Request('GET', '/ls', undefined, {
            path,
            recursive: String(recursive)
        });
    }
    B2Api.listFiles = listFiles;
    /**
     * Retrieve metadata for a single file.
     *
     * @param path - Full path: `bucket/key`.
     * @returns File metadata.
     */
    async function fileInfo(path) {
        return b2Request('GET', '/info', undefined, { path });
    }
    B2Api.fileInfo = fileInfo;
    /**
     * Upload a local file to B2.
     *
     * @param localPath - Absolute path on the Jupyter server.
     * @param b2Path - Destination path: `bucket/key`.
     * @returns Upload result with file ID and size.
     */
    async function upload(localPath, b2Path) {
        return b2Request('POST', '/upload', {
            local_path: localPath,
            b2_path: b2Path
        });
    }
    B2Api.upload = upload;
    /**
     * Download a B2 file to the Jupyter server's local filesystem.
     *
     * @param b2Path - Source path: `bucket/key`.
     * @param localPath - Optional destination on the server.
     * @returns Download result with local path and size.
     */
    async function download(b2Path, localPath) {
        return b2Request('POST', '/download', {
            b2_path: b2Path,
            local_path: localPath
        });
    }
    B2Api.download = download;
    /**
     * Generate a time-limited pre-signed download URL.
     *
     * @param path - File path: `bucket/key`.
     * @param expires - Validity duration in seconds (default: 3600).
     * @returns Object containing the URL and expiry.
     */
    async function presign(path, expires = 3600) {
        return b2Request('POST', '/presign', { path, expires });
    }
    B2Api.presign = presign;
    /**
     * Permanently delete a file version from B2.
     *
     * @param path - File path: `bucket/key`.
     */
    async function deleteFile(path) {
        return b2Request('POST', '/delete', { path });
    }
    B2Api.deleteFile = deleteFile;
    /**
     * Download a file to a local cache directory and return its path,
     * so JupyterLab's built-in viewers can open it.
     *
     * @param path - File path: `bucket/key`.
     * @returns Local path, file name, and size.
     */
    async function openFile(path) {
        return b2Request('POST', '/open', { path });
    }
    B2Api.openFile = openFile;
    /**
     * Create a new B2 bucket.
     *
     * @param name - Globally unique bucket name.
     * @param type - Visibility: `"allPrivate"` or `"allPublic"`.
     * @returns Created bucket metadata.
     */
    async function createBucket(name, type = 'allPrivate') {
        return b2Request('POST', '/create-bucket', { name, type });
    }
    B2Api.createBucket = createBucket;
    /**
     * Permanently delete an empty B2 bucket.
     *
     * @param name - Bucket name to delete.
     * @throws {Error} If the bucket is not empty.
     */
    async function deleteBucket(name) {
        return b2Request('POST', '/delete-bucket', { name });
    }
    B2Api.deleteBucket = deleteBucket;
    /**
     * Retrieve detailed bucket configuration and settings.
     *
     * @param name - Bucket name.
     * @returns Full bucket info including lifecycle rules and encryption.
     */
    async function bucketInfo(name) {
        return b2Request('GET', '/bucket-info', undefined, { name });
    }
    B2Api.bucketInfo = bucketInfo;
    /**
     * Update bucket settings (visibility, custom metadata).
     *
     * @param name - Bucket name.
     * @param updates - Fields to update.
     * @returns Updated bucket metadata.
     */
    async function updateBucket(name, updates) {
        return b2Request('POST', '/update-bucket', { name, ...updates });
    }
    B2Api.updateBucket = updateBucket;
    /**
     * Upload raw bytes (base64-encoded) directly to B2.
     *
     * Used by the drag-and-drop upload flow and the {@link B2Drive.save}
     * method.
     *
     * @param b2Path - Destination path: `bucket/key`.
     * @param contentBase64 - Base64-encoded file content.
     * @param contentType - MIME type (default: `application/octet-stream`).
     * @returns Upload result.
     */
    async function uploadBytes(b2Path, contentBase64, contentType = 'application/octet-stream') {
        return b2Request('POST', '/upload-bytes', {
            b2_path: b2Path,
            content_base64: contentBase64,
            content_type: contentType
        });
    }
    B2Api.uploadBytes = uploadBytes;
})(B2Api || (B2Api = {}));


/***/ },

/***/ "./lib/drive.js"
/*!**********************!*\
  !*** ./lib/drive.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   B2Drive: () => (/* binding */ B2Drive)
/* harmony export */ });
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/signaling */ "webpack/sharing/consume/default/@lumino/signaling");
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_signaling__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__);
/**
 * B2 Contents.IDrive implementation.
 *
 * This implements JupyterLab's `Contents.IDrive` interface backed by
 * the B2 server extension REST API. When registered with the
 * `ContentsManager`, JupyterLab's native `FileBrowser` works with B2
 * out of the box — same look, same breadcrumbs, same drag-and-drop.
 *
 * Files are accessed as `b2:bucket/path/to/file.csv` in JupyterLab.
 */



const API_PREFIX = '/b2/api/v1';
/**
 * Make a typed request to the B2 server extension.
 */
async function b2Fetch(settings, method, endpoint, body, queryParams) {
    let url = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__.URLExt.join(settings.baseUrl, API_PREFIX, endpoint);
    if (queryParams) {
        url += '?' + new URLSearchParams(queryParams).toString();
    }
    const init = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body && method !== 'GET') {
        init.body = JSON.stringify(body);
    }
    const resp = await _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeRequest(url, init, settings);
    if (!resp.ok) {
        throw new Error(`B2 API ${resp.status}: ${await resp.text()}`);
    }
    const json = await resp.json();
    if (json.status === 'error') {
        throw new Error(json.message);
    }
    return json.data;
}
/**
 * Convert a B2 file listing entry to a Contents.IModel.
 */
function toModel(bucket, file, prefix) {
    const isDir = file.name.endsWith('/') || file.action === 'folder' || file.action === 'virtual';
    const displayName = prefix ? file.name.slice(prefix.length) : file.name;
    const cleanName = displayName.replace(/\/$/, '');
    return {
        name: cleanName || file.name,
        path: `${bucket}/${file.name}`.replace(/\/$/, ''),
        last_modified: new Date(file.upload_timestamp || 0).toISOString(),
        created: new Date(file.upload_timestamp || 0).toISOString(),
        content: null,
        format: null,
        mimetype: file.content_type || 'application/octet-stream',
        size: file.size || 0,
        writable: true,
        type: isDir ? 'directory' : 'file',
        hash: undefined,
        hash_algorithm: undefined,
        indices: null,
    };
}
class B2Drive {
    constructor() {
        this.name = 'b2';
        this._fileChanged = new _lumino_signaling__WEBPACK_IMPORTED_MODULE_0__.Signal(this);
        this._uploadStatus = new _lumino_signaling__WEBPACK_IMPORTED_MODULE_0__.Signal(this);
        this._isDisposed = false;
        this._bucketNamePrompt = null;
        this.serverSettings = _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeSettings();
    }
    /**
     * Set a callback that prompts the user for a bucket name.
     * Called when "New Folder" is triggered at the root level.
     */
    setBucketNamePrompt(prompt) {
        this._bucketNamePrompt = prompt;
    }
    get fileChanged() {
        return this._fileChanged;
    }
    get isDisposed() {
        return this._isDisposed;
    }
    dispose() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        _lumino_signaling__WEBPACK_IMPORTED_MODULE_0__.Signal.clearData(this);
    }
    /**
     * Get a file or directory listing.
     */
    async get(localPath, options) {
        const path = localPath.replace(/^\/+/, '');
        // Root: list all buckets as directories
        if (!path) {
            const buckets = await b2Fetch(this.serverSettings, 'GET', '/buckets');
            return {
                name: '',
                path: '',
                last_modified: new Date().toISOString(),
                created: new Date().toISOString(),
                content: buckets.map(b => ({
                    name: b.name,
                    path: b.name,
                    last_modified: new Date().toISOString(),
                    created: new Date().toISOString(),
                    content: null,
                    format: null,
                    mimetype: '',
                    size: undefined,
                    writable: true,
                    type: 'directory',
                    hash: undefined,
                    hash_algorithm: undefined,
                    indices: null,
                })),
                format: 'json',
                mimetype: '',
                size: undefined,
                writable: true,
                type: 'directory',
                hash: undefined,
                hash_algorithm: undefined,
                indices: null,
            };
        }
        // Split into bucket + prefix
        const [bucket, ...rest] = path.split('/');
        const prefix = rest.join('/');
        // Check if this is a file (has extension and doesn't end with /)
        const looksLikeFile = prefix && !prefix.endsWith('/') && prefix.includes('.');
        if (looksLikeFile) {
            // Metadata only (content === false) — just get file info
            if ((options === null || options === void 0 ? void 0 : options.content) === false) {
                try {
                    const info = await b2Fetch(this.serverSettings, 'GET', '/info', undefined, {
                        path: `${bucket}/${prefix}`
                    });
                    return toModel(bucket, { ...info, name: info.file_name, action: 'upload' }, '');
                }
                catch (_a) {
                    // Fall through to directory listing
                }
            }
            else {
                // Content requested — download the actual file
                try {
                    const loaded = await b2Fetch(this.serverSettings, 'POST', '/load', {
                        path: `${bucket}/${prefix}`
                    });
                    // Fix mimetype: B2 often returns application/octet-stream for known types
                    const rawMime = loaded.content_type || 'application/octet-stream';
                    const mimeByExt = {
                        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                        '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
                        '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.tiff': 'image/tiff',
                        '.py': 'text/x-python', '.js': 'text/javascript', '.ts': 'text/typescript',
                        '.css': 'text/css', '.html': 'text/html', '.json': 'application/json',
                        '.xml': 'application/xml', '.yaml': 'text/yaml', '.yml': 'text/yaml',
                        '.md': 'text/markdown', '.txt': 'text/plain', '.csv': 'text/csv',
                        '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg',
                    };
                    const ext = '.' + (prefix.split('.').pop() || '').toLowerCase();
                    const mimetype = (rawMime === 'application/octet-stream' && mimeByExt[ext])
                        ? mimeByExt[ext]
                        : rawMime;
                    // Detect text files by mimetype OR by extension (B2 often returns
                    // application/octet-stream for code files)
                    const textExtensions = new Set([
                        '.py', '.js', '.ts', '.jsx', '.tsx', '.css', '.html', '.htm',
                        '.json', '.yaml', '.yml', '.toml', '.xml', '.svg', '.md',
                        '.txt', '.csv', '.tsv', '.sh', '.bash', '.zsh', '.fish',
                        '.r', '.R', '.jl', '.go', '.rs', '.c', '.h', '.cpp', '.hpp',
                        '.java', '.kt', '.rb', '.php', '.lua', '.sql', '.graphql',
                        '.env', '.ini', '.cfg', '.conf', '.properties', '.log',
                        '.ipynb', '.dockerfile', '.makefile', '.cmake',
                        '.gitignore', '.gitattributes', '.editorconfig',
                    ]);
                    const isText = mimetype.startsWith('text/') ||
                        mimetype === 'application/json' ||
                        mimetype === 'application/javascript' ||
                        mimetype === 'application/xml' ||
                        mimetype === 'application/x-python' ||
                        mimetype === 'application/x-yaml' ||
                        textExtensions.has(ext);
                    const fileName = loaded.file_name.split('/').pop() || loaded.file_name;
                    let content;
                    let format;
                    if (isText) {
                        content = decodeURIComponent(atob(loaded.content_base64)
                            .split('')
                            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                            .join(''));
                        format = 'text';
                    }
                    else {
                        content = loaded.content_base64;
                        format = 'base64';
                    }
                    return {
                        name: fileName,
                        path: `${bucket}/${prefix}`,
                        last_modified: new Date().toISOString(),
                        created: new Date().toISOString(),
                        content,
                        format,
                        mimetype,
                        size: loaded.size,
                        writable: true,
                        type: 'file',
                        hash: undefined,
                        hash_algorithm: undefined,
                        indices: null,
                    };
                }
                catch (_b) {
                    // Fall through to directory listing
                }
            }
        }
        // Directory listing — we request recursive=true and then parse the tree ourselves
        // because B2's non-recursive listing may not always return virtual folder entries
        const listPrefix = prefix ? (prefix.endsWith('/') ? prefix : prefix + '/') : '';
        const result = await b2Fetch(this.serverSettings, 'GET', '/ls', undefined, {
            path: `${bucket}/${listPrefix}`,
            recursive: 'true'
        });
        // Parse flat file list into immediate children (files + virtual folders)
        const content = [];
        const seenFolders = new Set();
        for (const f of result.files) {
            // Get the part after the current prefix
            const relativeName = listPrefix ? f.name.slice(listPrefix.length) : f.name;
            if (!relativeName)
                continue;
            // Check if this file is in a subfolder
            const slashIdx = relativeName.indexOf('/');
            if (slashIdx === -1) {
                // Direct child file — no subfolder
                console.log(`jupyterlab-b2 file: ${relativeName} size=${f.size} type=${f.content_type}`);
                content.push({
                    name: relativeName,
                    path: `${bucket}/${f.name}`,
                    last_modified: new Date(f.upload_timestamp || 0).toISOString(),
                    created: new Date(f.upload_timestamp || 0).toISOString(),
                    content: null,
                    format: null,
                    mimetype: f.content_type || 'application/octet-stream',
                    size: f.size || 0,
                    writable: true,
                    type: 'file',
                    hash: undefined,
                    hash_algorithm: undefined,
                    indices: null,
                });
            }
            else {
                // File is inside a subfolder — extract the folder name
                const folderName = relativeName.slice(0, slashIdx);
                if (!seenFolders.has(folderName)) {
                    seenFolders.add(folderName);
                    const folderPath = listPrefix + folderName;
                    content.push({
                        name: folderName,
                        path: `${bucket}/${folderPath}`,
                        last_modified: new Date().toISOString(),
                        created: new Date().toISOString(),
                        content: null,
                        format: null,
                        mimetype: '',
                        size: undefined,
                        writable: true,
                        type: 'directory',
                        hash: undefined,
                        hash_algorithm: undefined,
                        indices: null,
                    });
                }
            }
        }
        return {
            name: prefix ? prefix.split('/').filter(Boolean).pop() || bucket : bucket,
            path: path,
            last_modified: new Date().toISOString(),
            created: new Date().toISOString(),
            content,
            format: 'json',
            mimetype: '',
            size: undefined,
            writable: true,
            type: 'directory',
            hash: undefined,
            hash_algorithm: undefined,
            indices: null,
        };
    }
    async getDownloadUrl(localPath) {
        const result = await b2Fetch(this.serverSettings, 'POST', '/presign', { path: localPath, expires: 3600 });
        return result.url;
    }
    async newUntitled(options) {
        const parentPath = ((options === null || options === void 0 ? void 0 : options.path) || '').replace(/^\/+/, '');
        const type = (options === null || options === void 0 ? void 0 : options.type) || 'file';
        // At root level: create a new bucket with a user-provided name
        if (!parentPath) {
            let name = null;
            if (this._bucketNamePrompt) {
                name = await this._bucketNamePrompt();
            }
            else {
                // Fallback to browser prompt
                name = window.prompt('Create B2 Bucket\n\nBucket name (lowercase, alphanumeric, hyphens):');
            }
            if (!name || !name.trim()) {
                throw new Error('Bucket creation cancelled.');
            }
            const result = await b2Fetch(this.serverSettings, 'POST', '/create-bucket', { name: name.trim(), type: 'allPrivate' });
            return {
                name: result.name,
                path: result.name,
                last_modified: new Date().toISOString(),
                created: new Date().toISOString(),
                content: null,
                format: null,
                mimetype: '',
                size: undefined,
                writable: true,
                type: 'directory',
                hash: undefined,
                hash_algorithm: undefined,
                indices: null,
            };
        }
        // Create a folder (B2 uses a zero-byte file with trailing /)
        if (type === 'directory') {
            const folderName = `untitled-folder-${Date.now()}/`;
            const folderPath = parentPath.endsWith('/')
                ? `${parentPath}${folderName}`
                : `${parentPath}/${folderName}`;
            const encoded = btoa(''); // empty content
            await b2Fetch(this.serverSettings, 'POST', '/upload-bytes', {
                b2_path: `${folderPath}.b2_keep`,
                content_base64: encoded,
                content_type: 'application/x-directory'
            });
            return {
                name: folderName.replace(/\/$/, ''),
                path: folderPath.replace(/\/$/, ''),
                last_modified: new Date().toISOString(),
                created: new Date().toISOString(),
                content: null,
                format: null,
                mimetype: '',
                size: undefined,
                writable: true,
                type: 'directory',
                hash: undefined,
                hash_algorithm: undefined,
                indices: null,
            };
        }
        // Create an empty file
        const ext = (options === null || options === void 0 ? void 0 : options.ext) || '.txt';
        const fileName = `untitled${ext}`;
        const filePath = parentPath.endsWith('/')
            ? `${parentPath}${fileName}`
            : `${parentPath}/${fileName}`;
        const encoded = btoa('');
        await b2Fetch(this.serverSettings, 'POST', '/upload-bytes', {
            b2_path: filePath,
            content_base64: encoded,
            content_type: 'application/octet-stream'
        });
        return {
            name: fileName,
            path: filePath,
            last_modified: new Date().toISOString(),
            created: new Date().toISOString(),
            content: '',
            format: 'text',
            mimetype: 'text/plain',
            size: 0,
            writable: true,
            type: 'file',
            hash: undefined,
            hash_algorithm: undefined,
            indices: null,
        };
    }
    async delete(localPath) {
        const path = localPath.replace(/^\/+/, '');
        const parts = path.split('/').filter(Boolean);
        if (parts.length === 1) {
            // Top-level = bucket deletion.
            // Confirmation is handled by the b2:delete command in index.ts.
            await b2Fetch(this.serverSettings, 'POST', '/delete-bucket', {
                name: parts[0]
            });
        }
        else {
            // File/folder deletion
            await b2Fetch(this.serverSettings, 'POST', '/delete', {
                path
            });
        }
        this._fileChanged.emit({
            type: 'delete',
            oldValue: { path },
            newValue: { path: '' }
        });
    }
    async rename(oldLocalPath, newLocalPath) {
        const oldPath = oldLocalPath.replace(/^\/+/, '');
        const newPath = newLocalPath.replace(/^\/+/, '');
        console.log(`jupyterlab-b2 rename: "${oldPath}" -> "${newPath}"`);
        // No-op if same path (JupyterLab calls rename after newUntitled
        // even when user didn't change the name)
        if (oldPath === newPath) {
            return this.get(newPath, { content: false });
        }
        const oldParts = oldPath.split('/');
        const newParts = newPath.split('/');
        // Bucket rename: old path has no '/' — it's a top-level bucket name
        if (oldParts.length === 1 && newParts.length === 1) {
            // Delete old bucket, create new one with desired name
            await b2Fetch(this.serverSettings, 'POST', '/delete-bucket', {
                name: oldPath
            });
            const result = await b2Fetch(this.serverSettings, 'POST', '/create-bucket', { name: newPath, type: 'allPrivate' });
            this._fileChanged.emit({
                type: 'rename',
                oldValue: { path: oldPath },
                newValue: { path: newPath }
            });
            return {
                name: result.name,
                path: result.name,
                last_modified: new Date().toISOString(),
                created: new Date().toISOString(),
                content: null,
                format: null,
                mimetype: '',
                size: undefined,
                writable: true,
                type: 'directory',
                hash: undefined,
                hash_algorithm: undefined,
                indices: null,
            };
        }
        // File rename: copy to new name + delete old (B2 has no native rename)
        try {
            const result = await b2Fetch(this.serverSettings, 'POST', '/rename', {
                old_path: oldPath,
                new_path: newPath
            });
            const newBucket = newPath.split('/')[0];
            const model = toModel(newBucket, { ...result, name: result.file_name, action: 'upload' }, '');
            // Emit rename then also emit delete for old path — this ensures
            // the FileBrowserModel removes the old entry from its listing
            this._fileChanged.emit({
                type: 'delete',
                oldValue: { path: oldPath },
                newValue: null
            });
            this._fileChanged.emit({
                type: 'new',
                oldValue: null,
                newValue: model
            });
            return model;
        }
        catch (err) {
            throw new Error(`Rename failed: ${err}. B2 rename works by copying the file to ` +
                `the new name and deleting the original.`);
        }
    }
    /**
     * Signal emitted when an upload starts or finishes.
     * Consumers can use this to show progress UI.
     */
    get uploadStatus() {
        return this._uploadStatus;
    }
    async save(localPath, options) {
        if (options === null || options === void 0 ? void 0 : options.content) {
            this._uploadStatus.emit({ state: 'start', path: localPath });
            let encoded;
            if (options.format === 'base64') {
                encoded = options.content;
            }
            else {
                const text = typeof options.content === 'string'
                    ? options.content
                    : JSON.stringify(options.content);
                encoded = btoa(unescape(encodeURIComponent(text)));
            }
            try {
                await b2Fetch(this.serverSettings, 'POST', '/upload-bytes', {
                    b2_path: localPath,
                    content_base64: encoded,
                    content_type: options.mimetype || 'application/octet-stream'
                });
                this._uploadStatus.emit({ state: 'finish', path: localPath });
            }
            catch (err) {
                this._uploadStatus.emit({ state: 'error', path: localPath });
                throw err;
            }
        }
        const model = await this.get(localPath, { content: false });
        setTimeout(() => {
            this._fileChanged.emit({
                type: 'save',
                oldValue: null,
                newValue: model
            });
        }, 500);
        return model;
    }
    async copy(_fromPath, _toPath) {
        throw new Error('Copy not yet implemented for B2 drive.');
    }
    async createCheckpoint(_path) {
        return { id: 'b2-noop', last_modified: new Date().toISOString() };
    }
    async listCheckpoints(_path) {
        return [];
    }
    async restoreCheckpoint(_path, _checkpointID) {
        // No-op for B2
    }
    async deleteCheckpoint(_path, _checkpointID) {
        // No-op for B2
    }
}


/***/ },

/***/ "./lib/index.js"
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   bucketIcon: () => (/* binding */ bucketIcon),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _jupyterlab_filebrowser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/filebrowser */ "webpack/sharing/consume/default/@jupyterlab/filebrowser");
/* harmony import */ var _jupyterlab_filebrowser__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_filebrowser__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @jupyterlab/settingregistry */ "webpack/sharing/consume/default/@jupyterlab/settingregistry");
/* harmony import */ var _jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _drive__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./drive */ "./lib/drive.js");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./api */ "./lib/api.js");
/**
 * jupyterlab-b2: JupyterLab extension for Backblaze B2 Cloud Storage.
 *
 * Registers a `Contents.IDrive` named "b2" with JupyterLab's
 * ContentsManager, then creates a native FileBrowser backed by it.
 * The result is a sidebar panel that looks and behaves exactly like
 * JupyterLab's built-in file browser — same breadcrumbs, same icons,
 * same drag-and-drop — but backed by B2 Cloud Storage.
 */








// Backblaze flame icon — from official brand SVG, cleaned up
// Uses jp-icon3 class so JupyterLab themes it like all other sidebar icons (grey)
const b2IconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 108 82 82">
  <path class="jp-icon3" fill="#616161" d="m 100.14479,187.83572 c -8.048758,-1.07329 -15.346536,-6.50242 -18.656282,-13.87922 -1.519878,-3.38752 -1.898592,-5.18306 -2.042719,-9.68484 -0.154646,-4.83032 0.06705,-5.73848 0.969182,-3.97015 0.933843,1.83048 3.400371,4.07523 5.794621,5.27359 3.432214,1.71787 4.336967,1.81231 12.479991,1.30265 l 0.926042,-0.058 0.204412,2.11667 c 0.382243,3.95806 1.337923,6.26042 3.604443,8.68351 1.56803,1.67635 2.92044,2.44309 5.45054,3.09018 3.36157,0.85975 6.94712,0.65266 11.0504,-0.63824 1.20247,-0.3783 1.24801,-0.37433 1.00095,0.0873 -0.37538,0.70141 -3.05157,2.95583 -5.00065,4.21254 -4.2621,2.74808 -10.64409,4.14895 -15.78093,3.46396 z m 11.31566,-11.61138 c -4.21503,-1.51705 -6.40773,-5.30937 -6.10396,-10.55694 0.11408,-1.97053 0.2552,-2.40603 1.8216,-5.62145 l 1.69795,-3.48544 -0.0223,-3.07244 c -0.0186,-2.5562 -0.14151,-3.45032 -0.73177,-5.3214 -2.1208,-6.72274 -2.22068,-9.23134 -0.48484,-12.17665 1.15049,-1.95209 3.88761,-4.98934 5.48961,-6.09154 0.62498,-0.43 1.20225,-0.78181 1.28284,-0.78181 0.0806,0 -0.0992,0.47141 -0.39951,1.04759 -0.30032,0.57617 -0.71372,1.6775 -0.91866,2.44739 -1.15931,4.35514 0.39009,8.33004 5.70231,14.62898 3.41097,4.04454 5.94527,7.81684 6.89545,10.26386 2.56745,6.61201 0.87494,13.83593 -4.00517,17.09474 -3.08456,2.05979 -7.19874,2.71377 -10.22354,1.62511 z M 91.063311,161.65718 c -6.334414,-1.3312 -10.895108,-8.97817 -9.466011,-15.87176 0.78081,-3.76642 3.197739,-7.80131 7.4168,-12.38181 3.765264,-4.08782 5.605247,-7.04369 6.793129,-10.91292 1.097734,-3.57559 0.764688,-8.2419 -0.864081,-12.10663 -0.549185,-1.3031 -0.441701,-1.27324 1.582322,0.4396 1.765395,1.49397 6.58245,7.23185 7.52476,8.96319 1.47088,2.70249 1.91299,6.31793 1.10521,9.03803 -0.22732,0.76546 -1.0999,2.72671 -1.93906,4.35833 -1.62675,3.16291 -2.28781,5.55331 -2.00249,7.24095 0.0926,0.5476 0.59995,2.60298 1.12749,4.56751 0.84581,3.14972 0.96031,3.94777 0.96879,6.75244 0.009,3.07911 -0.0185,3.23771 -0.87246,4.97232 -1.02371,2.07946 -2.660678,3.53976 -4.912383,4.38223 -1.676338,0.6272 -4.83581,0.90028 -6.462016,0.55852 z"/>
</svg>`;
// Bucket icon — used for root-level items and the "New Bucket" button
const bucketIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <path class="jp-icon3" fill="#616161" stroke="#616161" stroke-width="0.5"
    d="M5 8h14l-1.5 11H6.5L5 8Z"/>
  <path class="jp-icon3" fill="none" stroke="#616161" stroke-width="1.5"
    d="M4 6.5C4 5.67 7.58 5 12 5s8 .67 8 1.5S16.42 8 12 8 4 7.33 4 6.5Z"/>
</svg>`;
// Bucket + plus badge icon — for "New Bucket" toolbar button
const newBucketIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <path class="jp-icon3" fill="#616161" stroke="#616161" stroke-width="0.5"
    d="M5 8h14l-1.5 11H6.5L5 8Z"/>
  <path class="jp-icon3" fill="none" stroke="#616161" stroke-width="1.5"
    d="M4 6.5C4 5.67 7.58 5 12 5s8 .67 8 1.5S16.42 8 12 8 4 7.33 4 6.5Z"/>
  <circle cx="18" cy="18" r="5" fill="#616161" class="jp-icon3"/>
  <path d="M18 15.5v5M15.5 18h5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;
// Exported for potential use in other components
const bucketIcon = new _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_5__.LabIcon({
    name: 'jupyterlab-b2:bucket',
    svgstr: bucketIconSvg
});
const newBucketIcon = new _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_5__.LabIcon({
    name: 'jupyterlab-b2:new-bucket',
    svgstr: newBucketIconSvg
});
const b2Icon = new _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_5__.LabIcon({
    name: 'jupyterlab-b2:icon',
    svgstr: b2IconSvg
});
const PLUGIN_ID = 'jupyterlab-b2:plugin';
/**
 * The main B2 JupyterLab extension plugin.
 */
const plugin = {
    id: PLUGIN_ID,
    description: 'Backblaze B2 Cloud Storage file browser for JupyterLab',
    autoStart: true,
    requires: [_jupyterlab_filebrowser__WEBPACK_IMPORTED_MODULE_3__.IFileBrowserFactory],
    optional: [_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILayoutRestorer, _jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_4__.ISettingRegistry],
    activate: (app, fileBrowserFactory, restorer, settingRegistry) => {
        console.log('jupyterlab-b2: activating B2 drive + file browser');
        // 1. Create and register the B2 drive
        const drive = new _drive__WEBPACK_IMPORTED_MODULE_6__.B2Drive();
        // Wire up the bucket name prompt so "New Folder" at root
        // shows a proper JupyterLab dialog instead of a browser prompt
        drive.setBucketNamePrompt(async () => {
            const result = await _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.InputDialog.getText({
                title: 'Create B2 Bucket',
                label: 'Bucket name (lowercase, alphanumeric, hyphens):',
                placeholder: 'my-new-bucket'
            });
            if (result.button.accept && result.value) {
                return result.value.trim();
            }
            return null;
        });
        app.serviceManager.contents.addDrive(drive);
        // 2. Create a native FileBrowser backed by the B2 drive
        const browser = fileBrowserFactory.createFileBrowser('b2-browser', {
            driveName: drive.name,
            state: restorer ? undefined : null
        });
        browser.id = 'jupyterlab-b2-browser';
        browser.title.icon = b2Icon;
        browser.title.caption = 'Backblaze B2';
        // Track uploads via the B2Drive's custom uploadStatus signal
        drive.uploadStatus.connect((_sender, status) => {
            const existingStatus = browser.node.querySelector('.b2-upload-status');
            const fileName = status.path.split('/').pop() || status.path;
            if (status.state === 'start') {
                // Show uploading indicator
                if (!existingStatus) {
                    const statusEl = document.createElement('div');
                    statusEl.className = 'b2-upload-status';
                    statusEl.textContent = `Uploading ${fileName}...`;
                    statusEl.style.cssText =
                        'padding: 4px 8px; font-size: 11px; color: var(--jp-brand-color1); ' +
                            'background: var(--jp-brand-color4); border-radius: 4px; margin: 4px 8px; ' +
                            'text-align: center; animation: b2-pulse 1.5s infinite;';
                    // Insert at the top of the browser panel
                    browser.node.insertBefore(statusEl, browser.node.firstChild);
                }
            }
            else if (status.state === 'finish') {
                if (existingStatus) {
                    existingStatus.textContent = `Uploaded ${fileName}!`;
                    existingStatus.style.color = 'var(--jp-success-color1)';
                    existingStatus.style.background = 'var(--jp-success-color3)';
                    existingStatus.style.animation = 'none';
                    setTimeout(() => existingStatus.remove(), 2500);
                }
            }
            else if (status.state === 'error') {
                if (existingStatus) {
                    existingStatus.textContent = `Failed to upload ${fileName}`;
                    existingStatus.style.color = 'var(--jp-error-color1)';
                    existingStatus.style.background = 'var(--jp-error-color3)';
                    existingStatus.style.animation = 'none';
                    setTimeout(() => existingStatus.remove(), 4000);
                }
            }
        });
        // 3. Add "New Bucket" toolbar button at the top of the file browser
        const newBucketButton = new _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_5__.ToolbarButton({
            icon: newBucketIcon,
            tooltip: 'New Bucket',
            onClick: async () => {
                const result = await _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.InputDialog.getText({
                    title: 'Create B2 Bucket',
                    label: 'Bucket name (lowercase, alphanumeric, hyphens):',
                    placeholder: 'my-new-bucket'
                });
                if (result.button.accept && result.value) {
                    const name = result.value.trim();
                    if (!name)
                        return;
                    try {
                        await _api__WEBPACK_IMPORTED_MODULE_7__.B2Api.createBucket(name, 'allPrivate');
                        await browser.model.refresh();
                    }
                    catch (err) {
                        console.error('Failed to create bucket:', err);
                    }
                }
            }
        });
        browser.toolbar.addItem('newBucket', newBucketButton);
        // 3b. Show file size column by default (JupyterLab hides it)
        const listing = browser.listing;
        if (listing && typeof listing.setColumnVisibility === 'function') {
            listing.setColumnVisibility('file_size', true);
        }
        // 4. Track root-level state for bucket icon CSS
        const updateRootState = () => {
            const currentPath = browser.model.path;
            // Root = empty, "/", or just "b2:" drive prefix with no bucket path
            const cleanPath = currentPath.replace(/^b2:/, '').replace(/^\/+/, '');
            const isRoot = !cleanPath;
            browser.node.dataset['b2Root'] = isRoot ? 'true' : 'false';
            console.log('jupyterlab-b2: path changed to', JSON.stringify(currentPath), 'isRoot:', isRoot);
        };
        browser.model.pathChanged.connect(updateRootState);
        // Also update on refresh (model emits refreshed signal)
        browser.model.refreshed.connect(updateRootState);
        // Set initial state
        browser.node.dataset['b2Root'] = 'true';
        // 5. Add to left sidebar
        app.shell.add(browser, 'left', { rank: 200 });
        // 5. Restore widget state on reload
        if (restorer) {
            restorer.add(browser, 'jupyterlab-b2-browser');
        }
        // 5. Register custom commands
        // "Create Bucket" command — shows a dialog to name the bucket
        app.commands.addCommand('b2:create-bucket', {
            label: 'Create B2 Bucket',
            icon: b2Icon,
            execute: async () => {
                const result = await _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.InputDialog.getText({
                    title: 'Create B2 Bucket',
                    label: 'Bucket name (lowercase, alphanumeric, hyphens):',
                    placeholder: 'my-new-bucket'
                });
                if (result.button.accept && result.value) {
                    const name = result.value.trim();
                    if (!name)
                        return;
                    try {
                        await _api__WEBPACK_IMPORTED_MODULE_7__.B2Api.createBucket(name, 'allPrivate');
                        // Refresh the file browser to show the new bucket
                        await browser.model.refresh();
                    }
                    catch (err) {
                        console.error('Failed to create bucket:', err);
                        await _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.InputDialog.getText({
                            title: 'Error',
                            label: `Failed to create bucket: ${err}`
                        });
                    }
                }
            }
        });
        // "Delete Bucket" command
        app.commands.addCommand('b2:delete-bucket', {
            label: 'Delete B2 Bucket',
            execute: async () => {
                // Get the current path to determine which bucket
                const currentPath = browser.model.path;
                const parts = currentPath.split('/').filter(Boolean);
                // Remove the drive prefix "b2:" if present
                let bucketName = parts[0] || '';
                if (bucketName.startsWith('b2:')) {
                    bucketName = bucketName.slice(3);
                }
                if (!bucketName) {
                    return;
                }
                const result = await _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.InputDialog.getText({
                    title: 'Delete Bucket',
                    label: `Type "${bucketName}" to confirm deletion:`
                });
                if (result.button.accept && result.value === bucketName) {
                    try {
                        await _api__WEBPACK_IMPORTED_MODULE_7__.B2Api.deleteBucket(bucketName);
                        // Navigate back to root and refresh
                        await browser.model.cd('/');
                        await browser.model.refresh();
                    }
                    catch (err) {
                        console.error('Failed to delete bucket:', err);
                    }
                }
            }
        });
        // "Bucket Settings" command — right-click on a bucket at root level
        app.commands.addCommand('b2:bucket-settings', {
            label: 'Bucket Settings',
            icon: b2Icon,
            isVisible: () => {
                return browser.node.dataset['b2Root'] === 'true';
            },
            execute: async () => {
                const selected = Array.from(browser.selectedItems());
                if (selected.length === 0)
                    return;
                const bucketName = selected[0].name;
                if (!bucketName)
                    return;
                try {
                    const info = await _api__WEBPACK_IMPORTED_MODULE_7__.B2Api.bucketInfo(bucketName);
                    const body = _buildBucketSettingsDialog(info);
                    const result = await (0,_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.showDialog)({
                        title: `Bucket Settings: ${bucketName}`,
                        body: new _lumino_widgets__WEBPACK_IMPORTED_MODULE_2__.Widget({ node: body }),
                        buttons: [
                            _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.Dialog.cancelButton({ label: 'Cancel' }),
                            _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.Dialog.okButton({ label: 'Save Changes' })
                        ]
                    });
                    if (result.button.accept) {
                        const typeSelect = body.querySelector('#b2-bucket-type');
                        const infoTextarea = body.querySelector('#b2-bucket-info');
                        const newType = typeSelect === null || typeSelect === void 0 ? void 0 : typeSelect.value;
                        const newInfo = {};
                        ((infoTextarea === null || infoTextarea === void 0 ? void 0 : infoTextarea.value) || '').split('\n').forEach(line => {
                            const trimmed = line.trim();
                            if (!trimmed)
                                return;
                            const eqIdx = trimmed.indexOf('=');
                            if (eqIdx > 0) {
                                newInfo[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
                            }
                        });
                        const updates = { bucket_info: newInfo };
                        if (newType && newType !== info.type) {
                            updates.type = newType;
                        }
                        try {
                            await _api__WEBPACK_IMPORTED_MODULE_7__.B2Api.updateBucket(bucketName, updates);
                            await browser.model.refresh();
                        }
                        catch (err) {
                            void (0,_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.showDialog)({
                                title: 'Error',
                                body: `Failed to update bucket: ${err}`,
                                buttons: [_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.Dialog.okButton()]
                            });
                        }
                    }
                }
                catch (err) {
                    void (0,_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.showDialog)({
                        title: 'Error',
                        body: `Failed to load bucket info: ${err}`,
                        buttons: [_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.Dialog.okButton()]
                    });
                }
            }
        });
        app.contextMenu.addItem({
            command: 'b2:bucket-settings',
            selector: '#jupyterlab-b2-browser .jp-DirListing-content',
            rank: 2
        });
        // 6. Add "New Bucket" context menu item — only visible at root level
        app.commands.addCommand('b2:new-bucket', {
            label: 'New Bucket',
            icon: b2Icon,
            isVisible: () => {
                return browser.node.dataset['b2Root'] === 'true';
            },
            execute: async () => {
                const result = await _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.InputDialog.getText({
                    title: 'Create B2 Bucket',
                    label: 'Bucket name (lowercase, alphanumeric, hyphens):',
                    placeholder: 'my-new-bucket'
                });
                if (result.button.accept && result.value) {
                    const name = result.value.trim();
                    if (!name)
                        return;
                    try {
                        await _api__WEBPACK_IMPORTED_MODULE_7__.B2Api.createBucket(name, 'allPrivate');
                        await browser.model.refresh();
                    }
                    catch (err) {
                        console.error('Failed to create bucket:', err);
                    }
                }
            }
        });
        app.contextMenu.addItem({
            command: 'b2:new-bucket',
            selector: '#jupyterlab-b2-browser .jp-DirListing-content',
            rank: 1
        });
        // "Delete" command — permanent delete with confirmation for both files and buckets
        app.commands.addCommand('b2:delete', {
            label: () => {
                const isRoot = browser.node.dataset['b2Root'] === 'true';
                return isRoot ? 'Delete Bucket' : 'Delete';
            },
            isVisible: () => true,
            execute: async () => {
                const isRoot = browser.node.dataset['b2Root'] === 'true';
                const selectedItems = Array.from(browser.selectedItems());
                if (selectedItems.length === 0)
                    return;
                if (isRoot) {
                    // Deleting a bucket — require typing the name
                    const bucketName = selectedItems[0].name;
                    const result = await _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.InputDialog.getText({
                        title: `Permanently delete bucket "${bucketName}"?`,
                        label: `This will permanently delete the bucket and ALL its contents.\nThis cannot be undone. Type "${bucketName}" to confirm:`,
                        placeholder: bucketName
                    });
                    if (result.button.accept && result.value === bucketName) {
                        try {
                            await _api__WEBPACK_IMPORTED_MODULE_7__.B2Api.deleteBucket(bucketName);
                            await browser.model.refresh();
                        }
                        catch (err) {
                            void (0,_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.showDialog)({
                                title: 'Error',
                                body: `Failed to delete bucket: ${err}`,
                                buttons: [_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.Dialog.okButton()]
                            });
                        }
                    }
                }
                else {
                    // Deleting files — standard confirmation
                    const names = selectedItems.map(i => i.name);
                    const message = names.length === 1
                        ? `Permanently delete "${names[0]}"?`
                        : `Permanently delete ${names.length} items?`;
                    const result = await (0,_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.showDialog)({
                        title: 'Delete',
                        body: `${message}\n\nThis cannot be undone — B2 does not have a trash.`,
                        buttons: [
                            _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.Dialog.cancelButton({ label: 'Cancel' }),
                            _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.Dialog.warnButton({ label: 'Delete' })
                        ]
                    });
                    if (result.button.accept) {
                        for (const item of selectedItems) {
                            try {
                                const currentPath = browser.model.path.replace(/^b2:/, '');
                                const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
                                await browser.model.manager.deleteFile(`b2:${fullPath}`);
                            }
                            catch (err) {
                                console.error(`Failed to delete ${item.name}:`, err);
                            }
                        }
                        await browser.model.refresh();
                    }
                }
            }
        });
        app.contextMenu.addItem({
            command: 'b2:delete',
            selector: '#jupyterlab-b2-browser .jp-DirListing-content',
            rank: 10
        });
        // 7. Toggle body class for CSS context menu filtering.
        //    Set class on right-click inside B2 browser, remove on menu close.
        browser.node.addEventListener('contextmenu', () => {
            document.body.classList.add('b2-browser-active');
            // Remove after menu closes (next click anywhere)
            const cleanup = () => {
                setTimeout(() => {
                    document.body.classList.remove('b2-browser-active');
                }, 100);
                document.removeEventListener('click', cleanup);
                document.removeEventListener('keydown', cleanup);
            };
            // Delay adding listener so it doesn't fire immediately
            setTimeout(() => {
                document.addEventListener('click', cleanup);
                document.addEventListener('keydown', cleanup);
            }, 50);
        });
        // 7. Load settings
        if (settingRegistry) {
            settingRegistry
                .load(PLUGIN_ID)
                .then(settings => {
                console.log('jupyterlab-b2: settings loaded', settings.composite);
            })
                .catch(reason => {
                console.error('jupyterlab-b2: failed to load settings', reason);
            });
        }
        console.log('jupyterlab-b2: B2 file browser registered as "b2:" drive');
    }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugin);
/**
 * Build the Bucket Settings dialog using safe DOM methods (no innerHTML).
 */
function _buildBucketSettingsDialog(info) {
    var _a;
    const body = document.createElement('div');
    body.style.cssText = 'min-width: 420px; font-size: 13px;';
    // Helper: create a row label + value
    const addRow = (table, label, value, isCode = false) => {
        const tr = table.insertRow();
        const tdLabel = tr.insertCell();
        tdLabel.style.cssText = 'padding: 5px 12px 5px 0; color: #666; white-space: nowrap; vertical-align: top;';
        tdLabel.textContent = label;
        const tdValue = tr.insertCell();
        tdValue.style.cssText = 'padding: 5px 0;';
        if (isCode) {
            const code = document.createElement('code');
            code.style.fontSize = '11px';
            code.textContent = value;
            tdValue.appendChild(code);
        }
        else {
            tdValue.textContent = value;
        }
    };
    // Info table
    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse; margin-bottom: 16px;';
    addRow(table, 'Name', info.name);
    addRow(table, 'Bucket ID', info.id, true);
    addRow(table, 'Revision', String((_a = info.revision) !== null && _a !== void 0 ? _a : '—'));
    addRow(table, 'Encryption', info.default_server_side_encryption || 'None');
    addRow(table, 'Retention', info.default_retention || 'None');
    addRow(table, 'File Lock', info.is_file_lock_enabled ? 'Enabled' : 'Disabled');
    addRow(table, 'Options', info.options.length ? info.options.join(', ') : '—');
    body.appendChild(table);
    // Visibility select
    const visDiv = document.createElement('div');
    visDiv.style.cssText = 'border-top: 1px solid #ddd; padding-top: 12px;';
    const visLabel = document.createElement('label');
    visLabel.style.cssText = 'display: block; font-weight: 600; margin-bottom: 6px;';
    visLabel.textContent = 'Visibility';
    visDiv.appendChild(visLabel);
    const select = document.createElement('select');
    select.id = 'b2-bucket-type';
    select.style.cssText = 'width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;';
    const optPrivate = document.createElement('option');
    optPrivate.value = 'allPrivate';
    optPrivate.textContent = 'Private (requires authentication)';
    optPrivate.selected = info.type === 'allPrivate';
    select.appendChild(optPrivate);
    const optPublic = document.createElement('option');
    optPublic.value = 'allPublic';
    optPublic.textContent = 'Public (anyone can download)';
    optPublic.selected = info.type === 'allPublic';
    select.appendChild(optPublic);
    visDiv.appendChild(select);
    body.appendChild(visDiv);
    // Custom bucket info
    const infoDiv = document.createElement('div');
    infoDiv.style.marginTop = '12px';
    const infoLabel = document.createElement('label');
    infoLabel.style.cssText = 'display: block; font-weight: 600; margin-bottom: 6px;';
    infoLabel.textContent = 'Custom Info (key=value, one per line)';
    infoDiv.appendChild(infoLabel);
    const textarea = document.createElement('textarea');
    textarea.id = 'b2-bucket-info';
    textarea.rows = 4;
    textarea.style.cssText = 'width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 12px; resize: vertical;';
    textarea.value = Object.entries(info.bucket_info).map(([k, v]) => `${k}=${v}`).join('\n');
    infoDiv.appendChild(textarea);
    body.appendChild(infoDiv);
    // Lifecycle rules (read-only display)
    if (info.lifecycle_rules.length > 0) {
        const lcDiv = document.createElement('div');
        lcDiv.style.marginTop = '12px';
        const lcLabel = document.createElement('label');
        lcLabel.style.cssText = 'display: block; font-weight: 600; margin-bottom: 6px;';
        lcLabel.textContent = 'Lifecycle Rules';
        lcDiv.appendChild(lcLabel);
        const lcTable = document.createElement('table');
        lcTable.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 12px;';
        const thead = lcTable.createTHead();
        const headerRow = thead.insertRow();
        ['Prefix', 'Hide after (days)', 'Delete after (days)'].forEach(text => {
            const th = document.createElement('th');
            th.style.cssText = 'text-align: left; padding: 4px; border-bottom: 1px solid #ddd;';
            th.textContent = text;
            headerRow.appendChild(th);
        });
        const tbody = lcTable.createTBody();
        info.lifecycle_rules.forEach(r => {
            var _a, _b;
            const row = tbody.insertRow();
            const c1 = row.insertCell();
            const code = document.createElement('code');
            code.textContent = r.fileNamePrefix || '(all)';
            c1.style.padding = '4px';
            c1.appendChild(code);
            const c2 = row.insertCell();
            c2.style.padding = '4px';
            c2.textContent = String((_a = r.daysFromUploadingToHiding) !== null && _a !== void 0 ? _a : '—');
            const c3 = row.insertCell();
            c3.style.padding = '4px';
            c3.textContent = String((_b = r.daysFromHidingToDeleting) !== null && _b !== void 0 ? _b : '—');
        });
        lcDiv.appendChild(lcTable);
        body.appendChild(lcDiv);
    }
    return body;
}


/***/ }

}]);
//# sourceMappingURL=lib_index_js.84633b8173def57480b2.js.map