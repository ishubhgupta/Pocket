import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVault } from '../contexts/VaultContext';
import { Lock, AlertCircle, Fingerprint, Scan } from 'lucide-react';

interface PrivateDataGuardProps {
  children: React.ReactNode;
  onUnlock?: () => void;
}

export const PrivateDataGuard: React.FC<PrivateDataGuardProps> = ({ children, onUnlock }) => {
  const { isAuthenticated, authenticate, lockUntil, failedAttempts, biometricAvailability, isBiometricEnabled, unlockWithBiometric } = useAuth();
  const { loadData } = useVault();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const handleBiometricUnlock = async () => {
    setBiometricLoading(true);
    setError('');
    
    try {
      const success = await unlockWithBiometric();
      if (success) {
        await loadData();
        onUnlock?.();
      } else {
        setError('Biometric authentication failed. Please use PIN.');
      }
    } catch (err) {
      console.error('Biometric unlock error:', err);
      setError('Biometric authentication failed. Please use PIN.');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await authenticate(pin);
    setLoading(false);

    if (success) {
      setPin('');
      await loadData();
      onUnlock?.();
    } else {
      setError(
        lockUntil && lockUntil > new Date()
          ? `Too many attempts. Locked until ${lockUntil.toLocaleTimeString()}`
          : 'Incorrect PIN. Please try again.'
      );
      setPin('');
    }
  };

  const isLocked = lockUntil && lockUntil > new Date();
  const remainingTime = isLocked
    ? Math.ceil((lockUntil.getTime() - Date.now()) / 1000)
    : 0;

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-8 rounded-xl bg-white shadow-lg border border-neutral-200 animate-scale-in">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg mb-4 shadow-sm">
            <Lock size={28} className="text-white" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold font-heading text-neutral-900 mb-2">Private Information</h2>
          <p className="text-neutral-600 text-sm">Enter your PIN to view private data</p>
        </div>

        {/* Biometric Unlock */}
        {biometricAvailability.available && isBiometricEnabled && !isLocked && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={biometricLoading}
              className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-98 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              {biometricLoading ? (
                <>
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  {biometricAvailability.type === 'face' ? (
                    <Scan size={22} strokeWidth={2} />
                  ) : (
                    <Fingerprint size={22} strokeWidth={2} />
                  )}
                  <span>Unlock with {biometricAvailability.type === 'face' ? 'Touch ID' : 'Fingerprint'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* OR Divider */}
        {biometricAvailability.available && isBiometricEnabled && !isLocked && (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500 font-medium">OR</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 text-left">
              Enter PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              autoFocus={!(biometricAvailability.available && isBiometricEnabled)}
              disabled={isLocked || loading}
              className="input-field text-center text-3xl tracking-widest py-4 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
              <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {failedAttempts > 0 && !isLocked && (
            <p className="text-sm text-amber-600 text-center font-medium px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
              Failed attempts: {failedAttempts}/5
            </p>
          )}

          {isLocked && (
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold mb-1">Account Locked</p>
              <p className="text-sm text-red-600">
                Please wait {Math.floor(remainingTime / 60)}m {remainingTime % 60}s
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLocked || loading || pin.length === 0}
            className={`w-full py-3 font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
              biometricAvailability.available && isBiometricEnabled
                ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-sm'
            }`}
          >
            {loading ? 'Verifying...' : isLocked ? 'Locked' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
};
