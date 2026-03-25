import { JupyterFrontEnd } from '@jupyterlab/application';
import { Widget } from '@lumino/widgets';
import { B2Api, IB2File } from './api';

/**
 * Format bytes to human-readable string.
 */
function humanSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

/**
 * Format a B2 timestamp (milliseconds) to a date string.
 */
function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Create a DOM element with attributes and children.
 */
function h(
  tag: string,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElement {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key.startsWith('data-')) {
      el.dataset[key.slice(5)] = val;
    } else {
      el.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

/**
 * The main B2 sidebar browser widget.
 *
 * Provides:
 * - Authentication form
 * - Bucket listing
 * - File browser with navigation
 * - File actions (download, presign URL)
 */
export class B2BrowserWidget extends Widget {
  private _authenticated = false;
  private _currentBucket = '';
  private _currentPrefix = '';
  private _breadcrumbs: string[] = [];
  private _app: JupyterFrontEnd | null = null;

  constructor(app?: JupyterFrontEnd) {
    super();
    this._app = app || null;
    this.addClass('b2-browser-widget');
    this._render();
  }

  /**
   * Render the widget content based on current state.
   */
  private _render(): void {
    if (!this._authenticated) {
      this._renderAuthForm();
    } else if (!this._currentBucket) {
      this._renderBucketList();
    } else {
      this._renderFileBrowser();
    }
  }

  /**
   * Clear the widget and return a fresh panel container.
   */
  private _clearAndCreatePanel(): HTMLElement {
    while (this.node.firstChild) {
      this.node.removeChild(this.node.firstChild);
    }
    const panel = h('div', { class: 'b2-panel' });
    this.node.appendChild(panel);
    return panel;
  }

  /**
   * Render the authentication form.
   */
  private _renderAuthForm(): void {
    const panel = this._clearAndCreatePanel();

    const header = h(
      'div',
      { class: 'b2-header' },
      h('h3', {}, 'Backblaze B2'),
      h('p', { class: 'b2-subtitle' }, 'Cloud Storage')
    );

    const statusMsg = h('div', { class: 'b2-status-msg', id: 'b2-auth-status' });

    const keyIdInput = h('input', {
      type: 'text',
      id: 'b2-key-id',
      placeholder: '005...',
      class: 'b2-input'
    }) as HTMLInputElement;

    const appKeyInput = h('input', {
      type: 'password',
      id: 'b2-app-key',
      placeholder: 'K005...',
      class: 'b2-input'
    }) as HTMLInputElement;

    const authBtn = h(
      'button',
      {
        id: 'b2-auth-btn',
        class: 'b2-btn b2-btn-primary'
      },
      'Connect'
    );

    const hint = h('p', { class: 'b2-hint' });
    hint.appendChild(document.createTextNode('Or set '));
    hint.appendChild(h('code', {}, 'B2_APPLICATION_KEY_ID'));
    hint.appendChild(document.createTextNode(' and '));
    hint.appendChild(h('code', {}, 'B2_APPLICATION_KEY'));
    hint.appendChild(document.createTextNode(' env vars'));

    const form = h(
      'div',
      { class: 'b2-auth-form' },
      statusMsg,
      h('label', {}, 'Application Key ID'),
      keyIdInput,
      h('label', {}, 'Application Key'),
      appKeyInput,
      authBtn,
      hint
    );

    panel.appendChild(header);
    panel.appendChild(form);

    // Try auto-auth
    this._tryAutoAuth();

    const handleAuth = async (): Promise<void> => {
      const keyId = keyIdInput.value;
      const appKey = appKeyInput.value;

      if (!keyId || !appKey) {
        statusMsg.textContent = 'Both fields are required';
        statusMsg.className = 'b2-status-msg b2-error';
        return;
      }

      (authBtn as HTMLButtonElement).disabled = true;
      authBtn.textContent = 'Connecting...';

      try {
        await B2Api.auth(keyId, appKey);
        this._authenticated = true;
        this._render();
      } catch (err) {
        statusMsg.textContent = `Failed: ${err}`;
        statusMsg.className = 'b2-status-msg b2-error';
        (authBtn as HTMLButtonElement).disabled = false;
        authBtn.textContent = 'Connect';
      }
    };

    authBtn.addEventListener('click', handleAuth);
    keyIdInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleAuth();
    });
    appKeyInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleAuth();
    });
  }

  /**
   * Try auto-auth from env vars via the server extension.
   */
  private async _tryAutoAuth(): Promise<void> {
    try {
      const status = await B2Api.status();
      if (status.authenticated) {
        this._authenticated = true;
        this._render();
      }
    } catch {
      // Not auto-authenticated, show form
    }
  }

  /**
   * Render the bucket list view.
   */
  private async _renderBucketList(): Promise<void> {
    const panel = this._clearAndCreatePanel();

    const refreshBtn = h('button', { class: 'b2-btn b2-btn-sm', title: 'Refresh' }, '↻');
    refreshBtn.addEventListener('click', () => this._renderBucketList());

    const header = h('div', { class: 'b2-header' }, h('h3', {}, 'B2 Buckets'), refreshBtn);

    const content = h('div', { class: 'b2-content' });
    content.appendChild(h('div', { class: 'b2-loading' }, 'Loading buckets...'));

    panel.appendChild(header);
    panel.appendChild(content);

    try {
      const buckets = await B2Api.listBuckets();

      // Clear loading
      while (content.firstChild) content.removeChild(content.firstChild);

      if (buckets.length === 0) {
        content.appendChild(h('p', { class: 'b2-empty' }, 'No buckets found'));
        return;
      }

      for (const b of buckets) {
        const icon = b.type === 'allPrivate' ? '🔒' : '🌐';
        const item = h(
          'div',
          { class: 'b2-list-item b2-bucket-item', 'data-bucket': b.name },
          h('span', { class: 'b2-icon' }, icon),
          h('span', { class: 'b2-name' }, b.name),
          h('span', { class: 'b2-badge' }, b.type)
        );

        item.addEventListener('click', () => {
          this._currentBucket = b.name;
          this._currentPrefix = '';
          this._breadcrumbs = [b.name];
          this._render();
        });

        content.appendChild(item);
      }

      // Create bucket button
      const createBtn = h('button', { class: 'b2-btn b2-btn-sm b2-btn-full' }, '+ New Bucket');
      createBtn.addEventListener('click', () => this._showCreateBucketDialog());
      content.appendChild(h('div', { class: 'b2-action-bar' }, createBtn));
    } catch (err) {
      while (content.firstChild) content.removeChild(content.firstChild);
      content.appendChild(h('p', { class: 'b2-error' }, `Error: ${err}`));
    }
  }

  /**
   * Show a dialog to create a new bucket.
   */
  private _showCreateBucketDialog(): void {
    const name = prompt('Bucket name:');
    if (!name) return;

    B2Api.createBucket(name, 'allPrivate')
      .then(() => this._renderBucketList())
      .catch(err => alert(`Failed to create bucket: ${err}`));
  }

  /**
   * Render the file browser for the current bucket/prefix.
   */
  private async _renderFileBrowser(): Promise<void> {
    const path = this._currentPrefix
      ? `${this._currentBucket}/${this._currentPrefix}`
      : this._currentBucket;

    const panel = this._clearAndCreatePanel();

    // Back button
    const backBtn = h('button', { class: 'b2-btn b2-btn-sm', title: 'Back' }, '←');
    backBtn.addEventListener('click', () => {
      if (this._currentPrefix) {
        const parts = this._currentPrefix.split('/').filter(Boolean);
        parts.pop();
        this._currentPrefix = parts.length ? parts.join('/') + '/' : '';
        this._breadcrumbs.pop();
      } else {
        this._currentBucket = '';
        this._breadcrumbs = [];
      }
      this._render();
    });

    // Breadcrumbs
    const breadcrumbsEl = h('div', { class: 'b2-breadcrumbs' });
    this._breadcrumbs.forEach((part, i) => {
      if (i > 0) breadcrumbsEl.appendChild(document.createTextNode(' / '));
      const crumb = h('span', { class: 'b2-breadcrumb-item' }, part);
      crumb.addEventListener('click', () => {
        if (i === 0) {
          this._currentPrefix = '';
          this._breadcrumbs = [this._currentBucket];
        } else {
          const parts = this._breadcrumbs.slice(1, i + 1);
          this._currentPrefix = parts.join('/') + '/';
          this._breadcrumbs = this._breadcrumbs.slice(0, i + 1);
        }
        this._render();
      });
      breadcrumbsEl.appendChild(crumb);
    });

    // Refresh button
    const refreshBtn = h('button', { class: 'b2-btn b2-btn-sm', title: 'Refresh' }, '↻');
    refreshBtn.addEventListener('click', () => this._render());

    const header = h('div', { class: 'b2-header' }, backBtn, breadcrumbsEl, refreshBtn);
    const content = h('div', { class: 'b2-content' });
    content.appendChild(h('div', { class: 'b2-loading' }, 'Loading files...'));

    panel.appendChild(header);
    panel.appendChild(content);

    try {
      const result = await B2Api.listFiles(path, false);

      // Clear loading
      while (content.firstChild) content.removeChild(content.firstChild);

      if (result.files.length === 0) {
        content.appendChild(h('p', { class: 'b2-empty' }, 'Empty'));
        return;
      }

      // Separate folders and files
      const folders: IB2File[] = [];
      const regularFiles: IB2File[] = [];
      for (const f of result.files) {
        const displayName = this._currentPrefix ? f.name.slice(this._currentPrefix.length) : f.name;
        if (displayName.endsWith('/') || f.action === 'folder') {
          folders.push(f);
        } else {
          regularFiles.push(f);
        }
      }

      // Folders first
      for (const f of folders) {
        const displayName = this._currentPrefix ? f.name.slice(this._currentPrefix.length) : f.name;
        const item = h(
          'div',
          { class: 'b2-list-item b2-folder-item' },
          h('span', { class: 'b2-icon' }, '📁'),
          h('span', { class: 'b2-name' }, displayName)
        );
        item.addEventListener('click', () => {
          this._currentPrefix = f.name;
          const folderName = f.name.split('/').filter(Boolean).pop() || '';
          this._breadcrumbs.push(folderName);
          this._render();
        });
        content.appendChild(item);
      }

      // Then files
      for (const f of regularFiles) {
        const displayName = this._currentPrefix ? f.name.slice(this._currentPrefix.length) : f.name;
        const fullPath = `${this._currentBucket}/${f.name}`;

        const downloadBtn = h(
          'button',
          {
            class: 'b2-btn b2-btn-xs',
            title: 'Download'
          },
          '⬇'
        );
        downloadBtn.addEventListener('click', async (e: Event) => {
          e.stopPropagation();
          try {
            await B2Api.download(fullPath);
            downloadBtn.textContent = '✅';
          } catch (err) {
            console.error('Download failed:', err);
          }
        });

        const linkBtn = h(
          'button',
          {
            class: 'b2-btn b2-btn-xs',
            title: 'Copy pre-signed URL'
          },
          '🔗'
        );
        linkBtn.addEventListener('click', async (e: Event) => {
          e.stopPropagation();
          try {
            const presignResult = await B2Api.presign(fullPath);
            await navigator.clipboard.writeText(presignResult.url);
            linkBtn.textContent = '📋';
            setTimeout(() => {
              linkBtn.textContent = '🔗';
            }, 2000);
          } catch (err) {
            console.error('Presign failed:', err);
          }
        });

        const item = h(
          'div',
          { class: 'b2-list-item b2-file-item' },
          h('span', { class: 'b2-icon' }, '📄'),
          h(
            'div',
            { class: 'b2-file-info' },
            h('span', { class: 'b2-name' }, displayName),
            h(
              'span',
              { class: 'b2-meta' },
              `${humanSize(f.size)} · ${formatDate(f.upload_timestamp)}`
            )
          ),
          h('div', { class: 'b2-actions' }, downloadBtn, linkBtn)
        );

        // Click to open in JupyterLab viewer
        item.addEventListener('click', () => this._openFile(fullPath));

        content.appendChild(item);
      }
      // Action bar: upload button
      const actionBar = h('div', { class: 'b2-action-bar' });
      const uploadBtn = h(
        'button',
        { class: 'b2-btn b2-btn-sm', title: 'Upload file from local' },
        '⬆ Upload'
      );
      uploadBtn.addEventListener('click', () => this._showUploadDialog());
      actionBar.appendChild(uploadBtn);
      content.appendChild(actionBar);
    } catch (err) {
      while (content.firstChild) content.removeChild(content.firstChild);
      content.appendChild(h('p', { class: 'b2-error' }, `Error: ${err}`));
    }
  }

  /**
   * Open a B2 file in JupyterLab's built-in viewer.
   *
   * Downloads to a local .b2-cache/ directory, then asks JupyterLab to open it.
   */
  private async _openFile(b2Path: string): Promise<void> {
    try {
      const result = await B2Api.openFile(b2Path);
      if (this._app) {
        this._app.commands.execute('docmanager:open', {
          path: result.local_path
        });
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }

  /**
   * Show a simple upload dialog using a hidden file input.
   */
  private _showUploadDialog(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.addEventListener('change', async () => {
      const files = input.files;
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = async () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let j = 0; j < bytes.length; j++) {
            binary += String.fromCharCode(bytes[j]);
          }
          const base64 = btoa(binary);
          const b2Path = `${this._currentBucket}/${this._currentPrefix}${file.name}`;

          try {
            await B2Api.uploadBytes(b2Path, base64, file.type || 'application/octet-stream');
            // Refresh the file list
            this._render();
          } catch (err) {
            console.error(`Upload failed for ${file.name}:`, err);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    });
    input.click();
  }
}
