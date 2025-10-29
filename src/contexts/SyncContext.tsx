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
  syncResult: { uploaded: number; downloaded: number; errors: string[] } | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
};

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncResult, setSyncResult] = useState<{ uploaded: number; downloaded: number; errors: string[] } | null>(null);

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
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncResult({ uploaded: 0, downloaded: 0, errors: [String(error)] });
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

  const value: SyncContextType = {
    user,
    isSignedIn: !!user,
    isLoading,
    isSyncing,
    lastSyncTime,
    signInWithGoogle,
    signOut,
    syncNow,
    syncResult
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};
