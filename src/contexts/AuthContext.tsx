import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { cryptoService } from '../services/crypto.service';
import { storageService } from '../services/storage.service';
import { arrayBufferToBase64 } from '../utils/crypto-helpers';
import { LOCKOUT_SCHEDULE, AUTO_LOCK_TIMEOUT, KDF_ITERATIONS } from '../utils/constants';

interface AuthContextType {
  isAuthenticated: boolean;
  masterKey: CryptoKey | null;
  lockUntil: Date | null;
  failedAttempts: number;
  isSetup: boolean | null; // null = loading, false = not setup, true = setup
  setupPin: (pin: string) => Promise<void>;
  authenticate: (pin: string) => Promise<boolean>;
  lock: () => void;
  isLocked: () => boolean;
  checkSetup: () => Promise<void>;
  getMasterKey: () => CryptoKey | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [lockUntil, setLockUntil] = useState<Date | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isSetup, setIsSetup] = useState<boolean | null>(null); // null = loading, false = not setup, true = setup
  
  const autoLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivity = useRef<number>(Date.now());

  // Check if app is already set up
  const checkSetup = useCallback(async () => {
    try {
      const meta = await storageService.getMeta();
      setIsSetup(!!meta);
    } catch (error) {
      console.error('Failed to check setup:', error);
      setIsSetup(false);
    }
  }, []);

  // Setup new PIN
  const setupPin = useCallback(async (pin: string) => {
    try {
      // Generate new master key
      const newMasterKey = await cryptoService.generateMasterKey();
      
      // Generate salt for PIN derivation
      const salt = cryptoService.generateSalt();
      
      // Derive key from PIN
      const pinKey = await cryptoService.derivePinKey(pin, salt, KDF_ITERATIONS);
      
      // Wrap master key with PIN key
      const { ciphertext, iv } = await cryptoService.wrapMasterKey(newMasterKey, pinKey);
      
      // Encrypt initial failed attempts counter
      const failedAttemptsData = await cryptoService.encryptData('0', newMasterKey);
      
      // Save to storage
      await storageService.saveMeta({
        k: 'config',
        encryptedMasterKey: ciphertext,
        masterIv: iv,
        kdfSalt: arrayBufferToBase64(salt),
        kdfIterations: KDF_ITERATIONS,
        failedAttempts: failedAttemptsData.ciphertext,
        autoLockTimeout: AUTO_LOCK_TIMEOUT,
      });

      setMasterKey(newMasterKey);
      setIsAuthenticated(true);
      setIsSetup(true);
      setFailedAttempts(0);
      resetAutoLockTimer();
    } catch (error) {
      console.error('Setup failed:', error);
      throw new Error('Failed to setup PIN');
    }
  }, []);

  // Authenticate with PIN
  const authenticate = useCallback(async (pin: string): Promise<boolean> => {
    try {
      // Check if locked
      const meta = await storageService.getMeta();
      if (!meta) {
        return false;
      }

      if (meta.lockUntil) {
        const lockTime = new Date(meta.lockUntil);
        if (lockTime > new Date()) {
          setLockUntil(lockTime);
          return false;
        }
      }

      // Derive PIN key
      const salt = new Uint8Array(atob(meta.kdfSalt).split('').map(c => c.charCodeAt(0)));
      const pinKey = await cryptoService.derivePinKey(pin, salt, meta.kdfIterations);

      // Try to unwrap master key
      try {
        const unwrappedKey = await cryptoService.unwrapMasterKey(
          meta.encryptedMasterKey,
          meta.masterIv,
          pinKey
        );

        // Success - reset failed attempts
        const failedAttemptsData = await cryptoService.encryptData('0', unwrappedKey);
        await storageService.saveMeta({
          ...meta,
          failedAttempts: failedAttemptsData.ciphertext,
          lockUntil: undefined,
          lastFailedTimestamp: undefined,
        });

        setMasterKey(unwrappedKey);
        setIsAuthenticated(true);
        setFailedAttempts(0);
        setLockUntil(null);
        resetAutoLockTimer();
        return true;
      } catch (error) {
        // Failed attempt - Get current count from encrypted storage or state
        let currentAttempts = failedAttempts;
        
        // Try to get the actual stored count if we have access
        if (meta.lastFailedTimestamp) {
          try {
            // We can't decrypt without the right key, so use local state
            currentAttempts = failedAttempts;
          } catch {
            currentAttempts = failedAttempts;
          }
        }
        
        const newAttempts = currentAttempts + 1;
        setFailedAttempts(newAttempts);

        // Update metadata with new timestamp
        await storageService.saveMeta({
          ...meta,
          lastFailedTimestamp: new Date().toISOString(),
        });

        // Calculate lockout time
        let newLockUntil: Date | null = null;
        if (newAttempts >= LOCKOUT_SCHEDULE.length) {
          const lockoutSeconds = LOCKOUT_SCHEDULE[LOCKOUT_SCHEDULE.length - 1];
          newLockUntil = new Date(Date.now() + lockoutSeconds * 1000);
        } else if (newAttempts > 1) {
          const lockoutSeconds = LOCKOUT_SCHEDULE[newAttempts - 1];
          newLockUntil = new Date(Date.now() + lockoutSeconds * 1000);
        }

        if (newLockUntil) {
          setLockUntil(newLockUntil);
          await storageService.saveMeta({
            ...meta,
            lockUntil: newLockUntil.toISOString(),
            lastFailedTimestamp: new Date().toISOString(),
          });
        }

        return false;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }, []);

  // Lock the app
  const lock = useCallback(() => {
    setIsAuthenticated(false);
    setMasterKey(null);
    if (autoLockTimer.current) {
      clearTimeout(autoLockTimer.current);
    }
  }, []);

  // Check if currently locked
  const isLocked = useCallback(() => {
    if (!lockUntil) return false;
    return lockUntil > new Date();
  }, [lockUntil]);

  // Reset auto-lock timer
  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimer.current) {
      clearTimeout(autoLockTimer.current);
    }

    autoLockTimer.current = setTimeout(() => {
      if (isAuthenticated) {
        lock();
      }
    }, AUTO_LOCK_TIMEOUT * 1000);
  }, [isAuthenticated, lock]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      if (isAuthenticated) {
        lastActivity.current = Date.now();
        resetAutoLockTimer();
      }
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (autoLockTimer.current) {
        clearTimeout(autoLockTimer.current);
      }
    };
  }, [isAuthenticated, resetAutoLockTimer]);

  // Lock when tab is hidden for too long
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Don't lock immediately, let the auto-lock timer handle it
        // This prevents immediate logout when switching tabs briefly
        return;
      } else {
        // Tab is now visible again, reset the timer
        if (isAuthenticated) {
          resetAutoLockTimer();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, resetAutoLockTimer]);

  const value = {
    isAuthenticated,
    masterKey,
    lockUntil,
    failedAttempts,
    isSetup,
    setupPin,
    authenticate,
    lock,
    isLocked,
    checkSetup,
    getMasterKey: () => masterKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
