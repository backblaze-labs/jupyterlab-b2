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

import { Signal, ISignal } from '@lumino/signaling';
import { Contents, ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

const API_PREFIX = '/b2/api/v1';

/**
 * Make a typed request to the B2 server extension.
 */
async function b2Fetch<T>(
  settings: ServerConnection.ISettings,
  method: string,
  endpoint: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>
): Promise<T> {
  let url = URLExt.join(settings.baseUrl, API_PREFIX, endpoint);
  if (queryParams) {
    url += '?' + new URLSearchParams(queryParams).toString();
  }
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }
  const resp = await ServerConnection.makeRequest(url, init, settings);
  if (!resp.ok) {
    throw new Error(`B2 API ${resp.status}: ${await resp.text()}`);
  }
  const json = await resp.json();
  if (json.status === 'error') {
    throw new Error(json.message);
  }
  return json.data as T;
}

/**
 * Convert a B2 file listing entry to a Contents.IModel.
 */
function toModel(
  bucket: string,
  file: {
    name: string;
    size: number;
    upload_timestamp: number;
    content_type: string;
    action: string;
  },
  prefix: string
): Contents.IModel {
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
    hash: undefined as unknown as string,
    hash_algorithm: undefined as unknown as string,
    indices: null
  };
}

/**
 * B2 drive that plugs into JupyterLab's ContentsManager.
 *
 * Paths inside this drive look like: `bucket/path/to/file.csv`
 * JupyterLab prefixes them with the drive name: `b2:bucket/path/to/file.csv`
 */
/**
 * Callback type for prompting the user for a bucket name.
 * If the user cancels, return null.
 */
export type BucketNamePrompt = () => Promise<string | null>;

export class B2Drive implements Contents.IDrive {
  readonly name = 'b2';
  readonly serverSettings: ServerConnection.ISettings;

  private _fileChanged = new Signal<this, Contents.IChangedArgs>(this);
  private _uploadStatus = new Signal<this, { state: 'start' | 'finish' | 'error'; path: string }>(
    this
  );
  private _isDisposed = false;
  private _bucketNamePrompt: BucketNamePrompt | null = null;

  constructor() {
    this.serverSettings = ServerConnection.makeSettings();
  }

  /**
   * Set a callback that prompts the user for a bucket name.
   * Called when "New Folder" is triggered at the root level.
   */
  setBucketNamePrompt(prompt: BucketNamePrompt): void {
    this._bucketNamePrompt = prompt;
  }

  get fileChanged(): ISignal<this, Contents.IChangedArgs> {
    return this._fileChanged;
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose(): void {
    if (this._isDisposed) return;
    this._isDisposed = true;
    Signal.clearData(this);
  }

  /**
   * Get a file or directory listing.
   */
  async get(localPath: string, options?: Contents.IFetchOptions): Promise<Contents.IModel> {
    const path = localPath.replace(/^\/+/, '');

    // Root: list all buckets as directories
    if (!path) {
      const buckets = await b2Fetch<Array<{ name: string; id: string; type: string }>>(
        this.serverSettings,
        'GET',
        '/buckets'
      );

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
          size: undefined as unknown as number,
          writable: true,
          type: 'directory' as Contents.ContentType,
          hash: undefined as unknown as string,
          hash_algorithm: undefined as unknown as string,
          indices: null
        })),
        format: 'json',
        mimetype: '',
        size: undefined as unknown as number,
        writable: true,
        type: 'directory',
        hash: undefined as unknown as string,
        hash_algorithm: undefined as unknown as string,
        indices: null
      };
    }

    // Split into bucket + prefix
    const [bucket, ...rest] = path.split('/');
    const prefix = rest.join('/');

    // Check if this is a file (has extension and doesn't end with /)
    const looksLikeFile = prefix && !prefix.endsWith('/') && prefix.includes('.');

    if (looksLikeFile) {
      // Metadata only (content === false) — just get file info
      if (options?.content === false) {
        try {
          const info = await b2Fetch<{
            file_name: string;
            size: number;
            content_type: string;
            upload_timestamp: number;
          }>(this.serverSettings, 'GET', '/info', undefined, {
            path: `${bucket}/${prefix}`
          });
          return toModel(bucket, { ...info, name: info.file_name, action: 'upload' }, '');
        } catch {
          // Fall through to directory listing
        }
      } else {
        // Content requested — download the actual file
        try {
          const loaded = await b2Fetch<{
            file_name: string;
            size: number;
            content_base64: string;
            content_type: string;
          }>(this.serverSettings, 'POST', '/load', {
            path: `${bucket}/${prefix}`
          });

          // Fix mimetype: B2 often returns application/octet-stream for known types
          const rawMime = loaded.content_type || 'application/octet-stream';
          const mimeByExt: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.bmp': 'image/bmp',
            '.ico': 'image/x-icon',
            '.svg': 'image/svg+xml',
            '.tiff': 'image/tiff',
            '.py': 'text/x-python',
            '.js': 'text/javascript',
            '.ts': 'text/typescript',
            '.css': 'text/css',
            '.html': 'text/html',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.yaml': 'text/yaml',
            '.yml': 'text/yaml',
            '.md': 'text/markdown',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
            '.pdf': 'application/pdf',
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg'
          };
          const ext = '.' + (prefix.split('.').pop() || '').toLowerCase();
          const mimetype =
            rawMime === 'application/octet-stream' && mimeByExt[ext] ? mimeByExt[ext] : rawMime;

          // Detect text files by mimetype OR by extension (B2 often returns
          // application/octet-stream for code files)
          const textExtensions = new Set([
            '.py',
            '.js',
            '.ts',
            '.jsx',
            '.tsx',
            '.css',
            '.html',
            '.htm',
            '.json',
            '.yaml',
            '.yml',
            '.toml',
            '.xml',
            '.svg',
            '.md',
            '.txt',
            '.csv',
            '.tsv',
            '.sh',
            '.bash',
            '.zsh',
            '.fish',
            '.r',
            '.R',
            '.jl',
            '.go',
            '.rs',
            '.c',
            '.h',
            '.cpp',
            '.hpp',
            '.java',
            '.kt',
            '.rb',
            '.php',
            '.lua',
            '.sql',
            '.graphql',
            '.env',
            '.ini',
            '.cfg',
            '.conf',
            '.properties',
            '.log',
            '.ipynb',
            '.dockerfile',
            '.makefile',
            '.cmake',
            '.gitignore',
            '.gitattributes',
            '.editorconfig'
          ]);
          const isText =
            mimetype.startsWith('text/') ||
            mimetype === 'application/json' ||
            mimetype === 'application/javascript' ||
            mimetype === 'application/xml' ||
            mimetype === 'application/x-python' ||
            mimetype === 'application/x-yaml' ||
            textExtensions.has(ext);

          const fileName = loaded.file_name.split('/').pop() || loaded.file_name;
          let content: string;
          let format: Contents.FileFormat;

          if (isText) {
            content = decodeURIComponent(
              atob(loaded.content_base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            format = 'text';
          } else {
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
            type: 'file' as Contents.ContentType,
            hash: undefined as unknown as string,
            hash_algorithm: undefined as unknown as string,
            indices: null
          };
        } catch {
          // Fall through to directory listing
        }
      }
    }

    // Directory listing — we request recursive=true and then parse the tree ourselves
    // because B2's non-recursive listing may not always return virtual folder entries
    const listPrefix = prefix ? (prefix.endsWith('/') ? prefix : prefix + '/') : '';
    const result = await b2Fetch<{
      bucket: string;
      prefix: string;
      files: Array<{
        name: string;
        size: number;
        upload_timestamp: number;
        content_type: string;
        action: string;
      }>;
    }>(this.serverSettings, 'GET', '/ls', undefined, {
      path: `${bucket}/${listPrefix}`,
      recursive: 'true'
    });

    // Parse flat file list into immediate children (files + virtual folders)
    const content: Contents.IModel[] = [];
    const seenFolders = new Set<string>();

    for (const f of result.files) {
      // Get the part after the current prefix
      const relativeName = listPrefix ? f.name.slice(listPrefix.length) : f.name;

      if (!relativeName) continue;

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
          hash: undefined as unknown as string,
          hash_algorithm: undefined as unknown as string,
          indices: null
        });
      } else {
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
            size: undefined as unknown as number,
            writable: true,
            type: 'directory',
            hash: undefined as unknown as string,
            hash_algorithm: undefined as unknown as string,
            indices: null
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
      size: undefined as unknown as number,
      writable: true,
      type: 'directory',
      hash: undefined as unknown as string,
      hash_algorithm: undefined as unknown as string,
      indices: null
    };
  }

  async getDownloadUrl(localPath: string): Promise<string> {
    const result = await b2Fetch<{ url: string }>(this.serverSettings, 'POST', '/presign', {
      path: localPath,
      expires: 3600
    });
    return result.url;
  }

  async newUntitled(options?: Contents.ICreateOptions): Promise<Contents.IModel> {
    const parentPath = (options?.path || '').replace(/^\/+/, '');
    const type = options?.type || 'file';

    // At root level: create a new bucket with a user-provided name
    if (!parentPath) {
      let name: string | null = null;

      if (this._bucketNamePrompt) {
        name = await this._bucketNamePrompt();
      } else {
        // Fallback to browser prompt
        name = window.prompt('Create B2 Bucket\n\nBucket name (lowercase, alphanumeric, hyphens):');
      }

      if (!name || !name.trim()) {
        throw new Error('Bucket creation cancelled.');
      }

      const result = await b2Fetch<{ name: string; id: string; type: string }>(
        this.serverSettings,
        'POST',
        '/create-bucket',
        { name: name.trim(), type: 'allPrivate' }
      );
      return {
        name: result.name,
        path: result.name,
        last_modified: new Date().toISOString(),
        created: new Date().toISOString(),
        content: null,
        format: null,
        mimetype: '',
        size: undefined as unknown as number,
        writable: true,
        type: 'directory',
        hash: undefined as unknown as string,
        hash_algorithm: undefined as unknown as string,
        indices: null
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
        size: undefined as unknown as number,
        writable: true,
        type: 'directory',
        hash: undefined as unknown as string,
        hash_algorithm: undefined as unknown as string,
        indices: null
      };
    }

    // Create an empty file
    const ext = options?.ext || '.txt';
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
      hash: undefined as unknown as string,
      hash_algorithm: undefined as unknown as string,
      indices: null
    };
  }

  async delete(localPath: string): Promise<void> {
    const path = localPath.replace(/^\/+/, '');
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 1) {
      // Top-level = bucket deletion.
      // Confirmation is handled by the b2:delete command in index.ts.
      await b2Fetch(this.serverSettings, 'POST', '/delete-bucket', {
        name: parts[0]
      });
    } else {
      // File/folder deletion
      await b2Fetch(this.serverSettings, 'POST', '/delete', {
        path
      });
    }

    this._fileChanged.emit({
      type: 'delete',
      oldValue: { path },
      newValue: { path: '' }
    } as Contents.IChangedArgs);
  }

  async rename(oldLocalPath: string, newLocalPath: string): Promise<Contents.IModel> {
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
      const result = await b2Fetch<{ name: string; id: string; type: string }>(
        this.serverSettings,
        'POST',
        '/create-bucket',
        { name: newPath, type: 'allPrivate' }
      );
      this._fileChanged.emit({
        type: 'rename',
        oldValue: { path: oldPath },
        newValue: { path: newPath }
      } as Contents.IChangedArgs);
      return {
        name: result.name,
        path: result.name,
        last_modified: new Date().toISOString(),
        created: new Date().toISOString(),
        content: null,
        format: null,
        mimetype: '',
        size: undefined as unknown as number,
        writable: true,
        type: 'directory',
        hash: undefined as unknown as string,
        hash_algorithm: undefined as unknown as string,
        indices: null
      };
    }

    // File rename: copy to new name + delete old (B2 has no native rename)
    try {
      const result = await b2Fetch<{
        file_name: string;
        size: number;
        content_type: string;
        upload_timestamp: number;
      }>(this.serverSettings, 'POST', '/rename', {
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
      } as unknown as Contents.IChangedArgs);

      this._fileChanged.emit({
        type: 'new',
        oldValue: null,
        newValue: model
      } as Contents.IChangedArgs);

      return model;
    } catch (err) {
      throw new Error(
        `Rename failed: ${err}. B2 rename works by copying the file to ` +
          `the new name and deleting the original.`
      );
    }
  }

  /**
   * Signal emitted when an upload starts or finishes.
   * Consumers can use this to show progress UI.
   */
  get uploadStatus(): ISignal<this, { state: 'start' | 'finish' | 'error'; path: string }> {
    return this._uploadStatus;
  }

  async save(localPath: string, options?: Partial<Contents.IModel>): Promise<Contents.IModel> {
    if (options?.content) {
      this._uploadStatus.emit({ state: 'start', path: localPath });

      let encoded: string;

      if (options.format === 'base64') {
        encoded = options.content as string;
      } else {
        const text =
          typeof options.content === 'string' ? options.content : JSON.stringify(options.content);
        encoded = btoa(unescape(encodeURIComponent(text)));
      }

      try {
        await b2Fetch(this.serverSettings, 'POST', '/upload-bytes', {
          b2_path: localPath,
          content_base64: encoded,
          content_type: options.mimetype || 'application/octet-stream'
        });
        this._uploadStatus.emit({ state: 'finish', path: localPath });
      } catch (err) {
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
      } as Contents.IChangedArgs);
    }, 500);

    return model;
  }

  async copy(_fromPath: string, _toPath: string): Promise<Contents.IModel> {
    throw new Error('Copy not yet implemented for B2 drive.');
  }

  async createCheckpoint(_path: string): Promise<Contents.ICheckpointModel> {
    return { id: 'b2-noop', last_modified: new Date().toISOString() };
  }

  async listCheckpoints(_path: string): Promise<Contents.ICheckpointModel[]> {
    return [];
  }

  async restoreCheckpoint(_path: string, _checkpointID: string): Promise<void> {
    // No-op for B2
  }

  async deleteCheckpoint(_path: string, _checkpointID: string): Promise<void> {
    // No-op for B2
  }
}
