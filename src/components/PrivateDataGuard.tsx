import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVault } from '../contexts/VaultContext';
import { Lock, AlertCircle } from 'lucide-react';

interface PrivateDataGuardProps {
  children: React.ReactNode;
  onUnlock?: () => void;
}

export const PrivateDataGuard: React.FC<PrivateDataGuardProps> = ({ children, onUnlock }) => {
  const { isAuthenticated, authenticate, lockUntil, failedAttempts } = useAuth();
  const { loadData } = useVault();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
              autoFocus
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
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : isLocked ? 'Locked' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
};
