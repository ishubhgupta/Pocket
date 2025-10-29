import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { firebaseAuthService } from '../services/firebase.service';
import { firebaseSyncService } from '../services/firebaseSync.service';

interface SyncContextType {
  user: User | null;
  isSignedIn: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  resetAndSync: () => Promise<void>;
  syncResult: { uploaded: number; downloaded: number; deleted: number; conflicts: number; errors: string[] } | null;
  onSyncComplete?: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
};

export const SyncProvider: React.FC<{ children: React.ReactNode; onSyncComplete?: () => void }> = ({ children, onSyncComplete }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncResult, setSyncResult] = useState<{ uploaded: number; downloaded: number; deleted: number; conflicts: number; errors: string[] } | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = firebaseAuthService.onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);

      // Auto-sync when user signs in
      if (user) {
        performSync();
      }
    });

    return () => unsubscribe();
  }, []);

  // Start real-time sync listener when user signs in
  useEffect(() => {
    if (!user) {
      firebaseSyncService.disableRealtimeSync();
      return;
    }

    console.log('[SyncContext] Enabling real-time sync...');
    firebaseSyncService.enableRealtimeSync(() => {
      console.log('[SyncContext] Real-time update detected');
      // Data will be auto-synced by the service
    });

    return () => {
      console.log('[SyncContext] Disabling real-time sync...');
      firebaseSyncService.disableRealtimeSync();
    };
  }, [user]);

  const performSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await firebaseSyncService.syncToCloud();
      setSyncResult(result);
      setLastSyncTime(Date.now());
      
      // Store last sync time in localStorage
      localStorage.setItem('pocket_last_sync', Date.now().toString());
      
      // Notify parent to reload vault data
      if (onSyncComplete) {
        onSyncComplete();
      }
      
      // Also trigger a custom event for vault to listen to
      window.dispatchEvent(new CustomEvent('sync-complete'));
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncResult({ uploaded: 0, downloaded: 0, deleted: 0, conflicts: 0, errors: [String(error)] });
    } finally {
      setIsSyncing(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await firebaseAuthService.signInWithGoogle();
      // Auto-sync will be triggered by onAuthStateChange
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseAuthService.signOut();
      setUser(null);
      setLastSyncTime(null);
      setSyncResult(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const syncNow = async () => {
    await performSync();
  };

  const resetAndSync = async () => {
    try {
      console.log('[SyncContext] Resetting sync and performing fresh sync...');
      await firebaseSyncService.resetSyncMetadata();
      await performSync();
    } catch (error) {
      console.error('[SyncContext] Reset and sync failed:', error);
      setSyncResult({ uploaded: 0, downloaded: 0, deleted: 0, conflicts: 0, errors: [String(error)] });
    }
  };

  const value: SyncContextType = {
    user,
    isSignedIn: !!user,
    isLoading,
    isSyncing,
    lastSyncTime,
    signInWithGoogle,
    signOut,
    syncNow,
    resetAndSync,
    syncResult
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};
