import type { BlobRecord } from './types';

const DB_NAME = 'instafake-gallery';
const DB_VERSION = 1;

export type StoreName =
  | 'users'
  | 'galleries'
  | 'photos'
  | 'comments'
  | 'commenters'
  | 'blobs'
  | 'meta';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      const ensure = (name: StoreName, keyPath: string, indexes: Array<[string, string]> = []) => {
        if (db.objectStoreNames.contains(name)) return;
        const store = db.createObjectStore(name, { keyPath });
        for (const [indexName, indexKeyPath] of indexes) store.createIndex(indexName, indexKeyPath);
      };
      ensure('users', 'id', [['username', 'username']]);
      ensure('galleries', 'id', [['userId', 'userId']]);
      ensure('photos', 'id', [
        ['userId', 'userId'],
        ['galleryId', 'galleryId'],
      ]);
      ensure('comments', 'id', [['photoId', 'photoId']]);
      ensure('commenters', 'id');
      ensure('blobs', 'id');
      ensure('meta', 'key');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Не удалось открыть локальную базу'));
    request.onblocked = () => reject(new Error('База открыта в другой вкладке. Закройте её и обновите страницу'));
  });
  return dbPromise;
}

async function withStore<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(name, mode);
    const request = handler(tx.objectStore(name));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error ?? new Error('Ошибка локальной базы'));
    tx.onabort = () => reject(tx.error ?? new Error('Транзакция отменена'));
  });
}

export function all<T>(store: StoreName): Promise<T[]> {
  return withStore<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);
}

export function put<T>(store: StoreName, value: T): Promise<IDBValidKey> {
  return withStore<IDBValidKey>(store, 'readwrite', (s) => s.put(value));
}

export async function putMany(store: StoreName, values: unknown[]): Promise<void> {
  if (values.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);
    for (const value of values) objectStore.put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Ошибка локальной базы'));
  });
}

export async function remove(store: StoreName, keys: string | string[]): Promise<void> {
  const list = Array.isArray(keys) ? keys : [keys];
  if (list.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);
    for (const key of list) objectStore.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Ошибка локальной базы'));
  });
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const record = await withStore<{ key: string; value: T } | undefined>(
    'meta',
    'readonly',
    (s) => s.get(key) as IDBRequest<{ key: string; value: T } | undefined>,
  );
  return record?.value;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await put('meta', { key, value });
}

const urlCache = new Map<string, string>();

export function cachedBlobUrl(id: string | null | undefined): string | null {
  if (!id) return null;
  return urlCache.get(id) ?? null;
}

export async function loadBlobUrl(id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const cached = urlCache.get(id);
  if (cached) return cached;
  const record = await withStore<BlobRecord | undefined>(
    'blobs',
    'readonly',
    (s) => s.get(id) as IDBRequest<BlobRecord | undefined>,
  );
  if (!record) return null;
  const url = URL.createObjectURL(record.blob);
  urlCache.set(id, url);
  return url;
}

export async function storeBlob(blob: Blob, id = crypto.randomUUID()): Promise<string> {
  await put<BlobRecord>('blobs', { id, blob });
  urlCache.set(id, URL.createObjectURL(blob));
  return id;
}

export function releaseBlobUrl(id: string | null | undefined): void {
  if (!id) return;
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
}
