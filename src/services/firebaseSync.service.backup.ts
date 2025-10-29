import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { firebaseAuthService } from './firebase.service';
import { StoredRecord } from '../types';
import { storageService } from './storage.service';

interface SyncMetadata {
  lastSyncTime: number;
  deviceId: string;
}

/**
 * Firebase Sync Service
 * Handles cross-device synchronization of encrypted data
 */
class FirebaseSyncService {
  private deviceId: string;
  private isSyncing = false;

  constructor() {
    // Generate or retrieve device ID
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
   * Upload local data to Firebase
   */
  async syncToCloud(): Promise<{ uploaded: number; downloaded: number; errors: string[] }> {
    if (this.isSyncing) {
      console.log('[Sync] Already in progress, skipping...');
      return { uploaded: 0, downloaded: 0, errors: ['Sync already in progress'] };
    }

    if (!firebaseAuthService.isSignedIn()) {
      console.log('[Sync] User not signed in');
      return { uploaded: 0, downloaded: 0, errors: ['User not signed in'] };
    }

    console.log('[Sync] Starting sync...');
    this.isSyncing = true;
    const result = { uploaded: 0, downloaded: 0, errors: [] as string[] };

    try {
      // Get last sync time
      const syncMeta = await this.getSyncMetadata();
      const lastSyncTime = syncMeta?.lastSyncTime || 0;
      console.log('[Sync] Last sync time:', lastSyncTime, lastSyncTime === 0 ? '(First sync)' : '');

      // Step 1: Upload changed local records
      const localRecords = await storageService.getAllRecords();
      console.log('[Sync] Local records found:', localRecords.length);
      
      // On first sync (lastSyncTime = 0), upload ALL records
      // On subsequent syncs, only upload changed records
      const changedRecords = lastSyncTime === 0 
        ? localRecords 
        : localRecords.filter((record) => new Date(record.updatedAt).getTime() > lastSyncTime);

      console.log('[Sync] Records to upload:', changedRecords.length);

      for (const record of changedRecords) {
        try {
          console.log('[Sync] Uploading record:', record.id, record.type);
          await this.uploadRecord(record);
          result.uploaded++;
        } catch (error) {
          console.error('[Sync] Upload failed for record', record.id, error);
          result.errors.push(`Failed to upload record ${record.id}: ${error}`);
        }
      }

      // Step 2: Download new/updated cloud records
      const cloudRecords = await this.downloadAllRecords();
      console.log('[Sync] Cloud records found:', cloudRecords.length);
      
      // Build a set of cloud record IDs for deletion detection
      const cloudRecordIds = new Set(cloudRecords.map(r => r.id));
      
      for (const cloudRecord of cloudRecords) {
        try {
          const cloudUpdateTime = cloudRecord.cloudUpdatedAt || 0;
          console.log('[Sync] Checking cloud record:', cloudRecord.id, 
            'cloudUpdatedAt:', cloudUpdateTime, 
            'lastSyncTime:', lastSyncTime,
            'shouldDownload:', lastSyncTime === 0 || cloudUpdateTime > lastSyncTime);
          
          // On first sync, download everything
          // On subsequent syncs, only download what changed since last sync
          const shouldDownload = lastSyncTime === 0 || cloudUpdateTime > lastSyncTime;
          
          if (!shouldDownload) {
            console.log('[Sync] Skipping record', cloudRecord.id, '- not newer than last sync');
            continue;
          }

          const localRecord = await storageService.getRecord(cloudRecord.id);
          
          if (!localRecord) {
            // New record from cloud
            console.log('[Sync] Downloading new record:', cloudRecord.id);
            await storageService.saveRecord(cloudRecord);
            result.downloaded++;
          } else {
            const localUpdateTime = new Date(localRecord.updatedAt).getTime();
            console.log('[Sync] Comparing timestamps - Local:', localUpdateTime, 'Cloud:', cloudUpdateTime);
            
            // If cloud is newer, update local
            if (cloudUpdateTime > localUpdateTime) {
              console.log('[Sync] Updating local record:', cloudRecord.id);
              await storageService.saveRecord(cloudRecord);
              result.downloaded++;
            } else {
              console.log('[Sync] Local record is newer or same, skipping');
            }
          }
        } catch (error) {
          console.error('[Sync] Download failed for record', cloudRecord.id, error);
          result.errors.push(`Failed to download record ${cloudRecord.id}: ${error}`);
        }
      }

      // Step 3: Detect and handle deletions (records in local but not in cloud)
      if (lastSyncTime > 0) {
        // Only check for deletions after first sync
        const localRecords = await storageService.getAllRecords();
        for (const localRecord of localRecords) {
          if (!cloudRecordIds.has(localRecord.id)) {
            console.log('[Sync] Record deleted from cloud, deleting locally:', localRecord.id);
            try {
              await storageService.deleteRecord(localRecord.id);
              result.downloaded++; // Count deletions as downloads
            } catch (error) {
              console.error('[Sync] Failed to delete local record:', localRecord.id, error);
            }
          }
        }
      }

      // Step 4: Update sync metadata
      await this.updateSyncMetadata();
      console.log('[Sync] Complete! Uploaded:', result.uploaded, 'Downloaded:', result.downloaded);

    } catch (error) {
      console.error('[Sync] Fatal error:', error);
      result.errors.push(`Sync failed: ${error}`);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Upload a single record to Firebase
   */
  private async uploadRecord(record: StoredRecord): Promise<void> {
    const userCollection = this.getUserCollection();
    const recordDoc = doc(userCollection, record.id.toString());

    const cloudRecord = {
      ...record,
      cloudUpdatedAt: Date.now(),
      deviceId: this.deviceId,
      serverTimestamp: serverTimestamp()
    };

    await setDoc(recordDoc, cloudRecord, { merge: true });
  }

  /**
   * Download all records from Firebase
   */
  private async downloadAllRecords(): Promise<(StoredRecord & { cloudUpdatedAt?: number })[]> {
    const userCollection = this.getUserCollection();
    const snapshot = await getDocs(userCollection);
    
    const records: (StoredRecord & { cloudUpdatedAt?: number })[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as StoredRecord & { cloudUpdatedAt?: number };
      records.push(data);
    });

    return records;
  }

  /**
   * Delete a record from Firebase
   */
  async deleteRecord(recordId: number): Promise<void> {
    if (!firebaseAuthService.isSignedIn()) {
      return;
    }

    try {
      const userCollection = this.getUserCollection();
      const recordDoc = doc(userCollection, recordId.toString());
      await deleteDoc(recordDoc);
    } catch (error) {
      console.error('Failed to delete record from cloud:', error);
      throw error;
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
      console.error('Failed to get sync metadata:', error);
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
   * Check if sync is available
   */
  canSync(): boolean {
    return firebaseAuthService.isSignedIn();
  }

  /**
   * Force full sync (upload all local data)
   */
  async forceFullSync(): Promise<{ uploaded: number; errors: string[] }> {
    if (!firebaseAuthService.isSignedIn()) {
      return { uploaded: 0, errors: ['User not signed in'] };
    }

    const result = { uploaded: 0, errors: [] as string[] };

    try {
      const localRecords = await storageService.getAllRecords();
      
      for (const record of localRecords) {
        try {
          await this.uploadRecord(record);
          result.uploaded++;
        } catch (error) {
          result.errors.push(`Failed to upload record ${record.id}: ${error}`);
        }
      }

      await this.updateSyncMetadata();
    } catch (error) {
      result.errors.push(`Force sync failed: ${error}`);
    }

    return result;
  }

  /**
   * Get sync status
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Reset sync metadata to force fresh sync on next attempt
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
   * Start listening for real-time changes from cloud
   */
  startRealtimeSync(onChangeCallback: () => void): () => void {
    if (!firebaseAuthService.isSignedIn()) {
      console.log('[Sync] Cannot start real-time sync: user not signed in');
      return () => {};
    }

    console.log('[Sync] Starting real-time sync listener...');
    const userCollection = this.getUserCollection();
    const q = query(userCollection);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('[Sync] Real-time update detected:', snapshot.docChanges().length, 'changes');
      
      // Trigger sync when changes detected
      if (!snapshot.metadata.hasPendingWrites && snapshot.docChanges().length > 0) {
        console.log('[Sync] Triggering sync due to cloud changes...');
        onChangeCallback();
      }
    }, (error) => {
      console.error('[Sync] Real-time sync error:', error);
    });

    return unsubscribe;
  }
}


export const firebaseSyncService = new FirebaseSyncService();
