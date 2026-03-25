/**
 * jupyterlab-b2: JupyterLab extension for Backblaze B2 Cloud Storage.
 *
 * Registers a `Contents.IDrive` named "b2" with JupyterLab's
 * ContentsManager, then creates a native FileBrowser backed by it.
 * The result is a sidebar panel that looks and behaves exactly like
 * JupyterLab's built-in file browser — same breadcrumbs, same icons,
 * same drag-and-drop — but backed by B2 Cloud Storage.
 */

import { ILayoutRestorer, JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { Dialog, InputDialog, showDialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { LabIcon, ToolbarButton } from '@jupyterlab/ui-components';
import { B2Drive } from './drive';
import { B2Api } from './api';

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
export const bucketIcon = new LabIcon({
  name: 'jupyterlab-b2:bucket',
  svgstr: bucketIconSvg
});

const newBucketIcon = new LabIcon({
  name: 'jupyterlab-b2:new-bucket',
  svgstr: newBucketIconSvg
});

const b2Icon = new LabIcon({
  name: 'jupyterlab-b2:icon',
  svgstr: b2IconSvg
});

const PLUGIN_ID = 'jupyterlab-b2:plugin';

/**
 * The main B2 JupyterLab extension plugin.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'Backblaze B2 Cloud Storage file browser for JupyterLab',
  autoStart: true,
  requires: [IFileBrowserFactory],
  optional: [ILayoutRestorer, ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    fileBrowserFactory: IFileBrowserFactory,
    restorer: ILayoutRestorer | null,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log('jupyterlab-b2: activating B2 drive + file browser');

    // 1. Create and register the B2 drive
    const drive = new B2Drive();

    // Wire up the bucket name prompt so "New Folder" at root
    // shows a proper JupyterLab dialog instead of a browser prompt
    drive.setBucketNamePrompt(async () => {
      const result = await InputDialog.getText({
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
    drive.uploadStatus.connect((_sender: B2Drive, status: { state: string; path: string }) => {
      const existingStatus = browser.node.querySelector('.b2-upload-status') as HTMLElement | null;
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
      } else if (status.state === 'finish') {
        if (existingStatus) {
          existingStatus.textContent = `Uploaded ${fileName}!`;
          existingStatus.style.color = 'var(--jp-success-color1)';
          existingStatus.style.background = 'var(--jp-success-color3)';
          existingStatus.style.animation = 'none';
          setTimeout(() => existingStatus.remove(), 2500);
        }
      } else if (status.state === 'error') {
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
    const newBucketButton = new ToolbarButton({
      icon: newBucketIcon,
      tooltip: 'New Bucket',
      onClick: async () => {
        const result = await InputDialog.getText({
          title: 'Create B2 Bucket',
          label: 'Bucket name (lowercase, alphanumeric, hyphens):',
          placeholder: 'my-new-bucket'
        });
        if (result.button.accept && result.value) {
          const name = result.value.trim();
          if (!name) return;
          try {
            await B2Api.createBucket(name, 'allPrivate');
            await browser.model.refresh();
          } catch (err) {
            console.error('Failed to create bucket:', err);
          }
        }
      }
    });
    browser.toolbar.addItem('newBucket', newBucketButton);

    // 3b. Show file size column by default (JupyterLab hides it)
    const listing = (browser as any).listing;
    if (listing && typeof listing.setColumnVisibility === 'function') {
      listing.setColumnVisibility('file_size', true);
    }

    // 4. Track root-level state for bucket icon CSS
    const updateRootState = (): void => {
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
        const result = await InputDialog.getText({
          title: 'Create B2 Bucket',
          label: 'Bucket name (lowercase, alphanumeric, hyphens):',
          placeholder: 'my-new-bucket'
        });

        if (result.button.accept && result.value) {
          const name = result.value.trim();
          if (!name) return;

          try {
            await B2Api.createBucket(name, 'allPrivate');
            // Refresh the file browser to show the new bucket
            await browser.model.refresh();
          } catch (err) {
            console.error('Failed to create bucket:', err);
            await InputDialog.getText({
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

        const result = await InputDialog.getText({
          title: 'Delete Bucket',
          label: `Type "${bucketName}" to confirm deletion:`
        });

        if (result.button.accept && result.value === bucketName) {
          try {
            await B2Api.deleteBucket(bucketName);
            // Navigate back to root and refresh
            await browser.model.cd('/');
            await browser.model.refresh();
          } catch (err) {
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
        if (selected.length === 0) return;
        const bucketName = selected[0].name;
        if (!bucketName) return;

        try {
          const info = await B2Api.bucketInfo(bucketName);
          const body = _buildBucketSettingsDialog(info);

          const result = await showDialog({
            title: `Bucket Settings: ${bucketName}`,
            body: new Widget({ node: body }),
            buttons: [
              Dialog.cancelButton({ label: 'Cancel' }),
              Dialog.okButton({ label: 'Save Changes' })
            ]
          });

          if (result.button.accept) {
            const typeSelect = body.querySelector('#b2-bucket-type') as HTMLSelectElement;
            const infoTextarea = body.querySelector('#b2-bucket-info') as HTMLTextAreaElement;
            const newType = typeSelect?.value;
            const newInfo: Record<string, string> = {};
            (infoTextarea?.value || '').split('\n').forEach(line => {
              const trimmed = line.trim();
              if (!trimmed) return;
              const eqIdx = trimmed.indexOf('=');
              if (eqIdx > 0) {
                newInfo[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
              }
            });

            const updates: Record<string, unknown> = { bucket_info: newInfo };
            if (newType && newType !== info.type) {
              updates.type = newType;
            }
            try {
              await B2Api.updateBucket(bucketName, updates as any);
              await browser.model.refresh();
            } catch (err) {
              void showDialog({
                title: 'Error',
                body: `Failed to update bucket: ${err}`,
                buttons: [Dialog.okButton()]
              });
            }
          }
        } catch (err) {
          void showDialog({
            title: 'Error',
            body: `Failed to load bucket info: ${err}`,
            buttons: [Dialog.okButton()]
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
        const result = await InputDialog.getText({
          title: 'Create B2 Bucket',
          label: 'Bucket name (lowercase, alphanumeric, hyphens):',
          placeholder: 'my-new-bucket'
        });
        if (result.button.accept && result.value) {
          const name = result.value.trim();
          if (!name) return;
          try {
            await B2Api.createBucket(name, 'allPrivate');
            await browser.model.refresh();
          } catch (err) {
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
        if (selectedItems.length === 0) return;

        if (isRoot) {
          // Deleting a bucket — require typing the name
          const bucketName = selectedItems[0].name;
          const result = await InputDialog.getText({
            title: `Permanently delete bucket "${bucketName}"?`,
            label: `This will permanently delete the bucket and ALL its contents.\nThis cannot be undone. Type "${bucketName}" to confirm:`,
            placeholder: bucketName
          });

          if (result.button.accept && result.value === bucketName) {
            try {
              await B2Api.deleteBucket(bucketName);
              await browser.model.refresh();
            } catch (err) {
              void showDialog({
                title: 'Error',
                body: `Failed to delete bucket: ${err}`,
                buttons: [Dialog.okButton()]
              });
            }
          }
        } else {
          // Deleting files — standard confirmation
          const names = selectedItems.map(i => i.name);
          const message =
            names.length === 1
              ? `Permanently delete "${names[0]}"?`
              : `Permanently delete ${names.length} items?`;

          const result = await showDialog({
            title: 'Delete',
            body: `${message}\n\nThis cannot be undone — B2 does not have a trash.`,
            buttons: [
              Dialog.cancelButton({ label: 'Cancel' }),
              Dialog.warnButton({ label: 'Delete' })
            ]
          });

          if (result.button.accept) {
            for (const item of selectedItems) {
              try {
                const currentPath = browser.model.path.replace(/^b2:/, '');
                const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
                await browser.model.manager.deleteFile(`b2:${fullPath}`);
              } catch (err) {
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
      const cleanup = (): void => {
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

export default plugin;

/**
 * Build the Bucket Settings dialog using safe DOM methods (no innerHTML).
 */
function _buildBucketSettingsDialog(info: {
  readonly name: string;
  readonly id: string;
  readonly type: string;
  readonly bucket_info: Readonly<Record<string, string>>;
  readonly lifecycle_rules: ReadonlyArray<{
    readonly daysFromHidingToDeleting: number | null;
    readonly daysFromUploadingToHiding: number | null;
    readonly fileNamePrefix: string;
  }>;
  readonly revision: number | null;
  readonly options: readonly string[];
  readonly default_server_side_encryption: string;
  readonly default_retention: string;
  readonly is_file_lock_enabled: boolean | null;
}): HTMLDivElement {
  const body = document.createElement('div');
  body.style.cssText = 'min-width: 420px; font-size: 13px;';

  // Helper: create a row label + value
  const addRow = (table: HTMLTableElement, label: string, value: string, isCode = false): void => {
    const tr = table.insertRow();
    const tdLabel = tr.insertCell();
    tdLabel.style.cssText =
      'padding: 5px 12px 5px 0; color: #666; white-space: nowrap; vertical-align: top;';
    tdLabel.textContent = label;
    const tdValue = tr.insertCell();
    tdValue.style.cssText = 'padding: 5px 0;';
    if (isCode) {
      const code = document.createElement('code');
      code.style.fontSize = '11px';
      code.textContent = value;
      tdValue.appendChild(code);
    } else {
      tdValue.textContent = value;
    }
  };

  // Info table
  const table = document.createElement('table');
  table.style.cssText = 'width: 100%; border-collapse: collapse; margin-bottom: 16px;';
  addRow(table, 'Name', info.name);
  addRow(table, 'Bucket ID', info.id, true);
  addRow(table, 'Revision', String(info.revision ?? '—'));
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
  select.style.cssText =
    'width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;';
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
  textarea.style.cssText =
    'width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 12px; resize: vertical;';
  textarea.value = Object.entries(info.bucket_info)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
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
      const row = tbody.insertRow();
      const c1 = row.insertCell();
      const code = document.createElement('code');
      code.textContent = r.fileNamePrefix || '(all)';
      c1.style.padding = '4px';
      c1.appendChild(code);
      const c2 = row.insertCell();
      c2.style.padding = '4px';
      c2.textContent = String(r.daysFromUploadingToHiding ?? '—');
      const c3 = row.insertCell();
      c3.style.padding = '4px';
      c3.textContent = String(r.daysFromHidingToDeleting ?? '—');
    });

    lcDiv.appendChild(lcTable);
    body.appendChild(lcDiv);
  }

  return body;
}
