import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp
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
      return { uploaded: 0, downloaded: 0, errors: ['Sync already in progress'] };
    }

    if (!firebaseAuthService.isSignedIn()) {
      return { uploaded: 0, downloaded: 0, errors: ['User not signed in'] };
    }

    this.isSyncing = true;
    const result = { uploaded: 0, downloaded: 0, errors: [] as string[] };

    try {
      // Get last sync time
      const syncMeta = await this.getSyncMetadata();
      const lastSyncTime = syncMeta?.lastSyncTime || 0;

      // Step 1: Upload changed local records
      const localRecords = await storageService.getAllRecords();
      const changedRecords = localRecords.filter(
        (record) => new Date(record.updatedAt).getTime() > lastSyncTime
      );

      for (const record of changedRecords) {
        try {
          await this.uploadRecord(record);
          result.uploaded++;
        } catch (error) {
          result.errors.push(`Failed to upload record ${record.id}: ${error}`);
        }
      }

      // Step 2: Download new/updated cloud records
      const cloudRecords = await this.downloadAllRecords();
      
      for (const cloudRecord of cloudRecords) {
        try {
          const cloudUpdateTime = cloudRecord.cloudUpdatedAt || 0;
          
          // Skip if cloud record is older than last sync
          if (cloudUpdateTime <= lastSyncTime) {
            continue;
          }

          const localRecord = await storageService.getRecord(cloudRecord.id);
          
          if (!localRecord) {
            // New record from cloud
            await storageService.saveRecord(cloudRecord);
            result.downloaded++;
          } else {
            const localUpdateTime = new Date(localRecord.updatedAt).getTime();
            
            // If cloud is newer, update local
            if (cloudUpdateTime > localUpdateTime) {
              await storageService.saveRecord(cloudRecord);
              result.downloaded++;
            }
          }
        } catch (error) {
          result.errors.push(`Failed to download record ${cloudRecord.id}: ${error}`);
        }
      }

      // Step 3: Update sync metadata
      await this.updateSyncMetadata();

    } catch (error) {
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
}

export const firebaseSyncService = new FirebaseSyncService();
