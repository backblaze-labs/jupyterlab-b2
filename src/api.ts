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

import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

// ────────────────────────────────────────────────────────────────────
// Public interfaces
// ────────────────────────────────────────────────────────────────────

/**
 * Metadata for a single file stored in B2.
 *
 * Returned by listing and info endpoints.
 */
export interface IB2File {
  /** The full file key (path) within the bucket. */
  readonly name: string;
  /** File size in bytes. */
  readonly size: number;
  /** Upload timestamp in milliseconds since epoch. */
  readonly upload_timestamp: number;
  /** Unique B2 file version ID. */
  readonly file_id: string;
  /** MIME content type (e.g. `"image/png"`). */
  readonly content_type: string;
  /**
   * B2 action type.
   *
   * Common values: `"upload"`, `"hide"`, `"folder"`, `"virtual"`.
   */
  readonly action: string;
}

/**
 * Metadata for a B2 bucket.
 */
export interface IB2Bucket {
  /** Display name of the bucket (globally unique). */
  readonly name: string;
  /** Unique bucket identifier. */
  readonly id: string;
  /** Bucket visibility: `"allPrivate"` or `"allPublic"`. */
  readonly type: 'allPrivate' | 'allPublic' | string;
}

/**
 * Authentication status response from the server extension.
 */
export interface IB2AuthStatus {
  /** Whether the server has valid B2 credentials. */
  readonly authenticated: boolean;
  /** B2 account identifier (only present when authenticated). */
  readonly account_id?: string;
  /** B2 API URL (only present when authenticated). */
  readonly api_url?: string;
}

/**
 * Response from a successful authentication request.
 */
export interface IB2AuthResult {
  /** B2 account identifier. */
  readonly account_id: string;
  /** B2 API base URL. */
  readonly api_url: string;
  /** S3-compatible API endpoint URL. */
  readonly s3_api_url: string;
}

/**
 * Response from an upload operation.
 */
export interface IB2UploadResult {
  /** File name/key as stored in B2. */
  readonly file_name: string;
  /** Unique file version ID. */
  readonly file_id: string;
  /** File size in bytes. */
  readonly size: number;
}

/**
 * Response from a download operation.
 */
export interface IB2DownloadResult {
  /** Name of the downloaded file. */
  readonly file_name: string;
  /** Local path where the file was saved. */
  readonly local_path: string;
  /** File size in bytes. */
  readonly size: number;
}

/**
 * Response from a pre-sign operation.
 */
export interface IB2PresignResult {
  /** Pre-signed download URL. */
  readonly url: string;
  /** Time-to-live in seconds. */
  readonly expires_in: number;
}

/**
 * Detailed bucket configuration returned by the bucket-info endpoint.
 */
export interface IB2BucketInfo {
  /** Bucket display name. */
  readonly name: string;
  /** Unique bucket identifier. */
  readonly id: string;
  /** Visibility type. */
  readonly type: 'allPrivate' | 'allPublic' | string;
  /** Arbitrary key–value metadata. */
  readonly bucket_info: Readonly<Record<string, string>>;
  /** CORS rules (opaque objects). */
  readonly cors_rules: ReadonlyArray<Readonly<Record<string, unknown>>>;
  /** Object lifecycle rules. */
  readonly lifecycle_rules: ReadonlyArray<{
    readonly daysFromHidingToDeleting: number | null;
    readonly daysFromUploadingToHiding: number | null;
    readonly fileNamePrefix: string;
  }>;
  /** Bucket revision number. */
  readonly revision: number;
  /** Enabled bucket options. */
  readonly options: readonly string[];
  /** Default server-side encryption setting. */
  readonly default_server_side_encryption: string;
  /** Default object retention policy. */
  readonly default_retention: string;
  /** Whether Object Lock is enabled. */
  readonly is_file_lock_enabled: boolean | null;
}

/**
 * Result of a file listing operation.
 */
export interface IB2ListResult {
  /** Bucket that was listed. */
  readonly bucket: string;
  /** Key prefix that was listed. */
  readonly prefix: string;
  /** Files matching the listing. */
  readonly files: readonly IB2File[];
}

/**
 * Fields accepted by the update-bucket endpoint.
 */
export interface IB2BucketUpdate {
  /** New visibility type. */
  readonly type?: 'allPrivate' | 'allPublic';
  /** New custom key–value metadata. */
  readonly bucket_info?: Readonly<Record<string, string>>;
}

/**
 * Result of a bucket update operation.
 */
export interface IB2BucketUpdateResult {
  readonly name: string;
  readonly id: string;
  readonly type: string;
  readonly bucket_info: Readonly<Record<string, string>>;
}

// ────────────────────────────────────────────────────────────────────
// Internal types
// ────────────────────────────────────────────────────────────────────

/**
 * Envelope returned by every server extension endpoint.
 *
 * @typeParam T - Shape of the `data` payload.
 * @internal
 */
interface IB2Response<T> {
  readonly status: 'ok' | 'error';
  readonly message: string;
  readonly data: T;
}

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
async function b2Request<T>(
  method: string,
  endpoint: string,
  body?: Readonly<Record<string, unknown>>,
  queryParams?: Readonly<Record<string, string>>
): Promise<T> {
  const settings = ServerConnection.makeSettings();
  let url = URLExt.join(settings.baseUrl, API_PREFIX, endpoint);

  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url += '?' + params.toString();
  }

  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  const response = await ServerConnection.makeRequest(url, init, settings);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`B2 API error (${response.status}): ${text}`);
  }

  const json = (await response.json()) as IB2Response<T>;

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
export namespace B2Api {
  /**
   * Authenticate with B2 using explicit application key credentials.
   *
   * @param keyId - B2 Application Key ID.
   * @param appKey - B2 Application Key (secret).
   * @returns Account and API URL information.
   */
  export async function auth(keyId: string, appKey: string): Promise<IB2AuthResult> {
    return b2Request('POST', '/auth', { key_id: keyId, app_key: appKey });
  }

  /**
   * Check whether the server extension is authenticated with B2.
   *
   * @returns Current authentication status.
   */
  export async function status(): Promise<IB2AuthStatus> {
    return b2Request('GET', '/status');
  }

  /**
   * List all buckets visible to the authenticated account.
   *
   * @returns Array of bucket metadata objects.
   */
  export async function listBuckets(): Promise<IB2Bucket[]> {
    return b2Request('GET', '/buckets');
  }

  /**
   * List files under a bucket and optional key prefix.
   *
   * @param path - Path in the form `bucket/prefix/`.
   * @param recursive - When `true`, list all descendant files.
   * @returns Listing result with bucket, prefix, and file array.
   */
  export async function listFiles(path: string, recursive = false): Promise<IB2ListResult> {
    return b2Request('GET', '/ls', undefined, {
      path,
      recursive: String(recursive)
    });
  }

  /**
   * Retrieve metadata for a single file.
   *
   * @param path - Full path: `bucket/key`.
   * @returns File metadata.
   */
  export async function fileInfo(path: string): Promise<IB2File> {
    return b2Request('GET', '/info', undefined, { path });
  }

  /**
   * Upload a local file to B2.
   *
   * @param localPath - Absolute path on the Jupyter server.
   * @param b2Path - Destination path: `bucket/key`.
   * @returns Upload result with file ID and size.
   */
  export async function upload(localPath: string, b2Path: string): Promise<IB2UploadResult> {
    return b2Request('POST', '/upload', {
      local_path: localPath,
      b2_path: b2Path
    });
  }

  /**
   * Download a B2 file to the Jupyter server's local filesystem.
   *
   * @param b2Path - Source path: `bucket/key`.
   * @param localPath - Optional destination on the server.
   * @returns Download result with local path and size.
   */
  export async function download(b2Path: string, localPath?: string): Promise<IB2DownloadResult> {
    return b2Request('POST', '/download', {
      b2_path: b2Path,
      local_path: localPath
    });
  }

  /**
   * Generate a time-limited pre-signed download URL.
   *
   * @param path - File path: `bucket/key`.
   * @param expires - Validity duration in seconds (default: 3600).
   * @returns Object containing the URL and expiry.
   */
  export async function presign(path: string, expires = 3600): Promise<IB2PresignResult> {
    return b2Request('POST', '/presign', { path, expires });
  }

  /**
   * Permanently delete a file version from B2.
   *
   * @param path - File path: `bucket/key`.
   */
  export async function deleteFile(path: string): Promise<void> {
    return b2Request('POST', '/delete', { path });
  }

  /**
   * Download a file to a local cache directory and return its path,
   * so JupyterLab's built-in viewers can open it.
   *
   * @param path - File path: `bucket/key`.
   * @returns Local path, file name, and size.
   */
  export async function openFile(path: string): Promise<IB2DownloadResult> {
    return b2Request('POST', '/open', { path });
  }

  /**
   * Create a new B2 bucket.
   *
   * @param name - Globally unique bucket name.
   * @param type - Visibility: `"allPrivate"` or `"allPublic"`.
   * @returns Created bucket metadata.
   */
  export async function createBucket(
    name: string,
    type: 'allPrivate' | 'allPublic' = 'allPrivate'
  ): Promise<IB2Bucket> {
    return b2Request('POST', '/create-bucket', { name, type });
  }

  /**
   * Permanently delete an empty B2 bucket.
   *
   * @param name - Bucket name to delete.
   * @throws {Error} If the bucket is not empty.
   */
  export async function deleteBucket(name: string): Promise<void> {
    return b2Request('POST', '/delete-bucket', { name });
  }

  /**
   * Retrieve detailed bucket configuration and settings.
   *
   * @param name - Bucket name.
   * @returns Full bucket info including lifecycle rules and encryption.
   */
  export async function bucketInfo(name: string): Promise<IB2BucketInfo> {
    return b2Request('GET', '/bucket-info', undefined, { name });
  }

  /**
   * Update bucket settings (visibility, custom metadata).
   *
   * @param name - Bucket name.
   * @param updates - Fields to update.
   * @returns Updated bucket metadata.
   */
  export async function updateBucket(
    name: string,
    updates: IB2BucketUpdate
  ): Promise<IB2BucketUpdateResult> {
    return b2Request('POST', '/update-bucket', { name, ...updates });
  }

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
  export async function uploadBytes(
    b2Path: string,
    contentBase64: string,
    contentType = 'application/octet-stream'
  ): Promise<IB2UploadResult> {
    return b2Request('POST', '/upload-bytes', {
      b2_path: b2Path,
      content_base64: contentBase64,
      content_type: contentType
    });
  }
}
