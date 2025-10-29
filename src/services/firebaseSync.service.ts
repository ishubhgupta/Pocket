import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { firebaseAuthService } from './firebase.service';
import { StoredRecord } from '../types';
import { storageService } from './storage.service';

interface SyncMetadata {
  lastSyncTime: number;
  deviceId: string;
}

interface CloudRecord extends StoredRecord {
  cloudUpdatedAt: number;
  deviceId: string;
  deleted?: boolean;
}

interface SyncResult {
  uploaded: number;
  downloaded: number;
  deleted: number;
  conflicts: number;
  errors: string[];
}

/**
 * Unified Firebase Sync Service
 * Handles bidirectional sync with conflict resolution and data integrity
 */
class FirebaseSyncService {
  private deviceId: string;
  private syncInProgress = false;
  private realtimeUnsubscribe: Unsubscribe | null = null;
  private syncCallback: (() => void) | null = null;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  /**
   * Get or create a unique device ID
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('pocket_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('pocket_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Get user's Firestore collection reference
   */
  private getUserCollection() {
    const userId = firebaseAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return collection(db, 'users', userId, 'records');
  }

  /**
   * Get sync metadata document reference
   */
  private getSyncMetaDoc() {
    const userId = firebaseAuthService.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return doc(db, 'users', userId, 'meta', 'sync');
  }

  /**
   * Main sync function - unified bidirectional sync
   */
  async syncToCloud(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('[Sync] Sync already in progress, skipping...');
      return { uploaded: 0, downloaded: 0, deleted: 0, conflicts: 0, errors: ['Sync already in progress'] };
    }

    if (!firebaseAuthService.isSignedIn()) {
      console.log('[Sync] User not signed in');
      return { uploaded: 0, downloaded: 0, deleted: 0, conflicts: 0, errors: ['User not signed in'] };
    }

    console.log('[Sync] ===== Starting Unified Sync =====');
    this.syncInProgress = true;
    const result: SyncResult = { uploaded: 0, downloaded: 0, deleted: 0, conflicts: 0, errors: [] };

    try {
      // Step 1: Get sync metadata
      const syncMeta = await this.getSyncMetadata();
      const lastSyncTime = syncMeta?.lastSyncTime || 0;
      console.log('[Sync] Last sync time:', lastSyncTime === 0 ? 'Never (First Sync)' : new Date(lastSyncTime).toLocaleString());

      // Step 2: Get local and cloud data
      const [localRecords, cloudRecords] = await Promise.all([
        storageService.getAllRecords(),
        this.downloadAllRecords()
      ]);

      console.log('[Sync] Local records:', localRecords.length, '| Cloud records:', cloudRecords.length);

      // Step 3: Build lookup maps for efficient comparison
      const localMap = new Map(localRecords.map(r => [r.id, r]));
      const cloudMap = new Map(cloudRecords.map(r => [r.id, r]));

      // Step 4: Upload new/modified local records
      for (const localRecord of localRecords) {
        try {
          const cloudRecord = cloudMap.get(localRecord.id);
          const localUpdateTime = new Date(localRecord.updatedAt).getTime();

          if (!cloudRecord) {
            // New local record - upload
            console.log('[Sync] ⬆ Uploading new record:', localRecord.id, localRecord.type);
            await this.uploadRecord(localRecord);
            result.uploaded++;
          } else if (cloudRecord.deleted) {
            // Cloud record is marked deleted - delete local
            console.log('[Sync] 🗑 Cloud record deleted, removing local:', localRecord.id);
            await storageService.deleteRecord(localRecord.id);
            result.deleted++;
          } else {
            const cloudUpdateTime = cloudRecord.cloudUpdatedAt;
            
            // Check if local is newer
            if (localUpdateTime > cloudUpdateTime) {
              // Local is newer - upload if not from this device
              if (cloudRecord.deviceId !== this.deviceId) {
                console.log('[Sync] ⬆ Uploading modified record:', localRecord.id);
                await this.uploadRecord(localRecord);
                result.uploaded++;
              }
            } else if (cloudUpdateTime > localUpdateTime) {
              // Cloud is newer - download
              console.log('[Sync] ⬇ Downloading updated record:', localRecord.id);
              await storageService.saveRecord(cloudRecord);
              result.downloaded++;
            }
            // If times are equal, do nothing (already in sync)
          }
        } catch (error) {
          console.error('[Sync] Error processing local record', localRecord.id, error);
          result.errors.push(`Failed to sync local record ${localRecord.id}: ${error}`);
        }
      }

      // Step 5: Download records that exist only in cloud
      for (const cloudRecord of cloudRecords) {
        try {
          if (!localMap.has(cloudRecord.id)) {
            if (cloudRecord.deleted) {
              // Already deleted, ignore
              console.log('[Sync] Ignoring deleted cloud record:', cloudRecord.id);
            } else {
              // New cloud record - download
              console.log('[Sync] ⬇ Downloading new cloud record:', cloudRecord.id);
              await storageService.saveRecord(cloudRecord);
              result.downloaded++;
            }
          }
        } catch (error) {
          console.error('[Sync] Error downloading cloud record', cloudRecord.id, error);
          result.errors.push(`Failed to download cloud record ${cloudRecord.id}: ${error}`);
        }
      }

      // Step 6: Update sync metadata
      await this.updateSyncMetadata();

      console.log('[Sync] ===== Sync Complete =====');
      console.log(`[Sync] ⬆ Uploaded: ${result.uploaded} | ⬇ Downloaded: ${result.downloaded} | 🗑 Deleted: ${result.deleted}`);
      
      if (result.errors.length > 0) {
        console.warn('[Sync] Errors encountered:', result.errors);
      }

    } catch (error) {
      console.error('[Sync] Fatal sync error:', error);
      result.errors.push(`Sync failed: ${error}`);
    } finally {
      this.syncInProgress = false;
    }

    // Notify listeners
    if (this.syncCallback) {
      this.syncCallback();
    }
    window.dispatchEvent(new CustomEvent('sync-complete'));

    return result;
  }

  /**
   * Upload a single record to Firebase with integrity checks
   */
  private async uploadRecord(record: StoredRecord): Promise<void> {
    // Validate record before upload
    if (!record.id || !record.type || !record.createdAt || !record.updatedAt) {
      throw new Error('Invalid record structure');
    }

    const userCollection = this.getUserCollection();
    const recordDoc = doc(userCollection, record.id.toString());

    const cloudRecord: any = {
      ...record,
      cloudUpdatedAt: Date.now(),
      deviceId: this.deviceId,
      serverTimestamp: serverTimestamp()
    };

    await setDoc(recordDoc, cloudRecord);
  }

  /**
   * Download all records from Firebase
   */
  private async downloadAllRecords(): Promise<CloudRecord[]> {
    const userCollection = this.getUserCollection();
    const snapshot = await getDocs(userCollection);
    
    const records: CloudRecord[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as CloudRecord;
      // Only include non-deleted records or recently deleted (for cleanup)
      if (!data.deleted || (data.cloudUpdatedAt && Date.now() - data.cloudUpdatedAt < 86400000)) {
        records.push(data);
      }
    });

    return records;
  }

  /**
   * Delete a record from Firebase (soft delete with marker)
   */
  async deleteRecord(recordId: number): Promise<void> {
    if (!firebaseAuthService.isSignedIn()) {
      console.log('[Sync] Cannot delete from cloud - user not signed in');
      return;
    }

    try {
      console.log('[Sync] 🗑 Marking record as deleted in cloud:', recordId);
      const userCollection = this.getUserCollection();
      const recordDoc = doc(userCollection, recordId.toString());

      // Soft delete: mark as deleted instead of removing
      await setDoc(recordDoc, {
        id: recordId,
        deleted: true,
        cloudUpdatedAt: Date.now(),
        deviceId: this.deviceId,
        serverTimestamp: serverTimestamp()
      }, { merge: true });

      console.log('[Sync] Record marked as deleted successfully');
    } catch (error) {
      console.error('[Sync] Failed to delete record from cloud:', error);
      throw error;
    }
  }

  /**
   * Enable real-time sync listener
   */
  enableRealtimeSync(callback: () => void): void {
    if (this.realtimeUnsubscribe) {
      console.log('[Sync] Real-time sync already enabled');
      return;
    }

    if (!firebaseAuthService.isSignedIn()) {
      console.log('[Sync] Cannot enable real-time sync - user not signed in');
      return;
    }

    this.syncCallback = callback;
    const userCollection = this.getUserCollection();

    console.log('[Sync] 📡 Enabling real-time sync listener...');
    
    this.realtimeUnsubscribe = onSnapshot(
      userCollection,
      (snapshot) => {
        if (this.syncInProgress) {
          console.log('[Sync] Ignoring snapshot - sync in progress');
          return;
        }

        console.log('[Sync] 📡 Real-time update detected:', snapshot.docChanges().length, 'changes');
        
        // Debounce: only sync if changes from other devices
        let hasExternalChanges = false;
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data() as CloudRecord;
          if (data.deviceId !== this.deviceId) {
            hasExternalChanges = true;
          }
        });

        if (hasExternalChanges) {
          console.log('[Sync] External changes detected, triggering sync...');
          setTimeout(() => this.syncToCloud(), 1000); // Debounce 1 second
        }
      },
      (error) => {
        console.error('[Sync] Real-time listener error:', error);
      }
    );
  }

  /**
   * Disable real-time sync listener
   */
  disableRealtimeSync(): void {
    if (this.realtimeUnsubscribe) {
      console.log('[Sync] 📡 Disabling real-time sync listener');
      this.realtimeUnsubscribe();
      this.realtimeUnsubscribe = null;
      this.syncCallback = null;
    }
  }

  /**
   * Get sync metadata
   */
  private async getSyncMetadata(): Promise<SyncMetadata | null> {
    try {
      const metaDoc = this.getSyncMetaDoc();
      const snapshot = await getDoc(metaDoc);
      
      if (snapshot.exists()) {
        return snapshot.data() as SyncMetadata;
      }
      return null;
    } catch (error) {
      console.error('[Sync] Failed to get sync metadata:', error);
      return null;
    }
  }

  /**
   * Update sync metadata
   */
  private async updateSyncMetadata(): Promise<void> {
    const metaDoc = this.getSyncMetaDoc();
    await setDoc(metaDoc, {
      lastSyncTime: Date.now(),
      deviceId: this.deviceId,
      serverTimestamp: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Reset sync metadata to force fresh sync
   */
  async resetSyncMetadata(): Promise<void> {
    try {
      console.log('[Sync] Resetting sync metadata...');
      const metaDoc = this.getSyncMetaDoc();
      await setDoc(metaDoc, {
        lastSyncTime: 0,
        deviceId: this.deviceId,
        serverTimestamp: serverTimestamp()
      });
      console.log('[Sync] Sync metadata reset successfully');
    } catch (error) {
      console.error('[Sync] Failed to reset sync metadata:', error);
      throw error;
    }
  }

  /**
   * Check if sync is available
   */
  canSync(): boolean {
    return firebaseAuthService.isSignedIn();
  }

  /**
   * Get sync status
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Cleanup deleted records from cloud (older than 24 hours)
   */
  async cleanupDeletedRecords(): Promise<number> {
    if (!firebaseAuthService.isSignedIn()) {
      return 0;
    }

    try {
      console.log('[Sync] 🧹 Cleaning up old deleted records...');
      const userCollection = this.getUserCollection();
      const snapshot = await getDocs(userCollection);
      
      const cutoffTime = Date.now() - 86400000; // 24 hours ago
      let cleaned = 0;

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data() as CloudRecord;
        if (data.deleted && data.cloudUpdatedAt < cutoffTime) {
          await deleteDoc(doc(userCollection, docSnapshot.id));
          cleaned++;
        }
      }

      console.log('[Sync] Cleaned up', cleaned, 'old deleted records');
      return cleaned;
    } catch (error) {
      console.error('[Sync] Cleanup failed:', error);
      return 0;
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();
