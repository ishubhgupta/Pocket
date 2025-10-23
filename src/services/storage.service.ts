import { DB_NAME, DB_VERSION, STORE_META, STORE_RECORDS } from '../utils/constants';
import { MetaConfig, StoredRecord } from '../types';

/**
 * StorageService manages IndexedDB operations for both encrypted and plaintext data
 */
class StorageService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB with proper schema
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Meta object store for configuration
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'k' });
        }

        // Records object store for all data
        if (!db.objectStoreNames.contains(STORE_RECORDS)) {
          const recordStore = db.createObjectStore(STORE_RECORDS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          recordStore.createIndex('type', 'type', { unique: false });
          recordStore.createIndex('isPrivate', 'isPrivate', { unique: false });
        }
      };
    });
  }

  /**
   * Get metadata configuration
   */
  async getMeta(): Promise<MetaConfig | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_META], 'readonly');
      const store = transaction.objectStore(STORE_META);
      const request = store.get('config');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save metadata configuration
   */
  async saveMeta(meta: MetaConfig): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_META], 'readwrite');
      const store = transaction.objectStore(STORE_META);
      const request = store.put(meta);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records
   */
  async getAllRecords(): Promise<StoredRecord[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_RECORDS], 'readonly');
      const store = transaction.objectStore(STORE_RECORDS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get records by type
   */
  async getRecordsByType(type: string): Promise<StoredRecord[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_RECORDS], 'readonly');
      const store = transaction.objectStore(STORE_RECORDS);
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single record by ID
   */
  async getRecord(id: number): Promise<StoredRecord | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_RECORDS], 'readonly');
      const store = transaction.objectStore(STORE_RECORDS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save a record (create or update)
   */
  async saveRecord(record: StoredRecord): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_RECORDS], 'readwrite');
      const store = transaction.objectStore(STORE_RECORDS);
      const request = store.put(record);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a record
   */
  async deleteRecord(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_RECORDS], 'readwrite');
      const store = transaction.objectStore(STORE_RECORDS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all records
   */
  async clearRecords(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_RECORDS], 'readwrite');
      const store = transaction.objectStore(STORE_RECORDS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data including meta
   */
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_META, STORE_RECORDS], 'readwrite');
      
      const metaStore = transaction.objectStore(STORE_META);
      const recordsStore = transaction.objectStore(STORE_RECORDS);
      
      metaStore.clear();
      recordsStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const storageService = new StorageService();
