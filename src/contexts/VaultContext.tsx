import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { RecordData, StoredRecord } from '../types';
import { cryptoService } from '../services/crypto.service';
import { storageService } from '../services/storage.service';
import { firebaseSyncService } from '../services/firebaseSync.service';
import { useAuth } from './AuthContext';
import Fuse from 'fuse.js';

interface VaultContextType {
  privateRecords: RecordData[];
  publicRecords: RecordData[];
  loading: boolean;
  loadData: () => Promise<void>;
  addRecord: (record: Omit<RecordData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecord: (id: number, record: Partial<RecordData>) => Promise<void>;
  deleteRecord: (id: number) => Promise<void>;
  searchRecords: (query: string) => RecordData[];
  clearPrivateData: () => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within VaultProvider');
  }
  return context;
};

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { masterKey, isAuthenticated } = useAuth();
  const [privateRecords, setPrivateRecords] = useState<RecordData[]>([]);
  const [publicRecords, setPublicRecords] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from storage
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const allRecords = await storageService.getAllRecords();

      const publicData: RecordData[] = [];
      const privateData: RecordData[] = [];

      for (const record of allRecords) {
        if (record.isPrivate) {
          if (masterKey && record.ciphertext && record.iv) {
            try {
              const decrypted = await cryptoService.decryptData(
                record.ciphertext,
                record.iv,
                masterKey
              );
              const data = JSON.parse(decrypted);
              privateData.push({
                ...data,
                id: record.id,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
                tags: record.tags,
              });
            } catch (error) {
              console.error('Failed to decrypt record:', record.id, error);
            }
          }
        } else if (record.plaintext) {
          const data = JSON.parse(record.plaintext);
          publicData.push({
            ...data,
            id: record.id,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            tags: record.tags,
          });
        }
      }

      setPrivateRecords(privateData);
      setPublicRecords(publicData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [masterKey]);

  // Listen for sync completion and reload data
  useEffect(() => {
    const handleSyncComplete = () => {
      console.log('Sync completed, reloading vault data...');
      loadData();
    };

    window.addEventListener('sync-complete', handleSyncComplete);
    return () => window.removeEventListener('sync-complete', handleSyncComplete);
  }, [loadData]);

  // Add new record
  const addRecord = useCallback(async (record: Omit<RecordData, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const recordData = {
        ...record,
        createdAt: now,
        updatedAt: now,
      };

      const storedRecord: Partial<StoredRecord> = {
        type: record.type,
        isPrivate: record.isPrivate,
        createdAt: now,
        updatedAt: now,
        tags: record.tags || [],
      };

      if (record.isPrivate && masterKey) {
        const { ciphertext, iv } = await cryptoService.encryptData(
          JSON.stringify(recordData),
          masterKey
        );
        storedRecord.ciphertext = ciphertext;
        storedRecord.iv = iv;
      } else {
        storedRecord.plaintext = JSON.stringify(recordData);
      }

      const id = await storageService.saveRecord(storedRecord as StoredRecord);

      const newRecord = { ...recordData, id } as RecordData;

      if (record.isPrivate) {
        setPrivateRecords(prev => [...prev, newRecord]);
      } else {
        setPublicRecords(prev => [...prev, newRecord]);
      }

      // Trigger background sync if user is signed in
      if (firebaseSyncService.canSync()) {
        firebaseSyncService.syncToCloud().catch(err => console.error('Background sync failed:', err));
      }
    } catch (error) {
      console.error('Failed to add record:', error);
      throw error;
    }
  }, [masterKey]);

  // Update record
  const updateRecord = useCallback(async (id: number, updates: Partial<RecordData>) => {
    try {
      const existingRecord = await storageService.getRecord(id);
      if (!existingRecord) {
        throw new Error('Record not found');
      }

      const now = new Date().toISOString();
      let currentData: RecordData;

      if (existingRecord.isPrivate && existingRecord.ciphertext && existingRecord.iv && masterKey) {
        const decrypted = await cryptoService.decryptData(
          existingRecord.ciphertext,
          existingRecord.iv,
          masterKey
        );
        currentData = JSON.parse(decrypted);
      } else if (existingRecord.plaintext) {
        currentData = JSON.parse(existingRecord.plaintext);
      } else {
        throw new Error('Invalid record data');
      }

      const updatedData = {
        ...currentData,
        ...updates,
        id,
        updatedAt: now,
      };

      const storedRecord: StoredRecord = {
        ...existingRecord,
        updatedAt: now,
        tags: updatedData.tags || existingRecord.tags,
      };

      if (existingRecord.isPrivate && masterKey) {
        const { ciphertext, iv } = await cryptoService.encryptData(
          JSON.stringify(updatedData),
          masterKey
        );
        storedRecord.ciphertext = ciphertext;
        storedRecord.iv = iv;
      } else {
        storedRecord.plaintext = JSON.stringify(updatedData);
      }

      await storageService.saveRecord(storedRecord);

      if (existingRecord.isPrivate) {
        setPrivateRecords(prev => prev.map(r => r.id === id ? updatedData as RecordData : r));
      } else {
        setPublicRecords(prev => prev.map(r => r.id === id ? updatedData as RecordData : r));
      }

      // Trigger background sync if user is signed in
      if (firebaseSyncService.canSync()) {
        firebaseSyncService.syncToCloud().catch(err => console.error('Background sync failed:', err));
      }
    } catch (error) {
      console.error('Failed to update record:', error);
      throw error;
    }
  }, [masterKey]);

  // Delete record
  const deleteRecord = useCallback(async (id: number) => {
    try {
      await storageService.deleteRecord(id);
      setPrivateRecords(prev => prev.filter(r => r.id !== id));
      setPublicRecords(prev => prev.filter(r => r.id !== id));

      // Delete from cloud and trigger sync
      if (firebaseSyncService.canSync()) {
        firebaseSyncService.deleteRecord(id).catch(err => console.error('Failed to delete from cloud:', err));
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
      throw error;
    }
  }, []);

  // Search records
  const searchRecords = useCallback((query: string): RecordData[] => {
    if (!query.trim()) {
      return [...publicRecords, ...(isAuthenticated ? privateRecords : [])];
    }

    const searchableRecords = [...publicRecords, ...(isAuthenticated ? privateRecords : [])];
    
    const fuse = new Fuse(searchableRecords, {
      keys: [
        // Card fields
        'bankName',
        'cardholderName',
        'cardType',
        'cardNumber',
        // Netbanking fields
        'accountHolderName',
        'loginId',
        'url',
        'accountNumber',
        // Note fields
        'title',
        'content',
        // Common fields
        'tags',
      ],
      threshold: 0.4,
      includeScore: true,
    });

    return fuse.search(query).map(result => result.item);
  }, [publicRecords, privateRecords, isAuthenticated]);

  // Clear private data from memory
  const clearPrivateData = useCallback(() => {
    setPrivateRecords([]);
  }, []);

  // Load public data on mount, reload when authentication changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when masterKey becomes available (user authenticates)
  useEffect(() => {
    if (masterKey) {
      loadData();
    }
  }, [masterKey, loadData]);

  const value = {
    privateRecords,
    publicRecords,
    loading,
    loadData,
    addRecord,
    updateRecord,
    deleteRecord,
    searchRecords,
    clearPrivateData,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};
