import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { AlertTriangle, Fingerprint, Scan } from 'lucide-react';

export const UnlockPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const { 
    authenticate, 
    lockUntil, 
    failedAttempts,
    biometricAvailability,
    isBiometricEnabled,
    unlockWithBiometric,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (lockUntil) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, lockUntil.getTime() - Date.now());
        setRemainingTime(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lockUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (remainingTime > 0) {
      setError('Please wait before trying again');
      return;
    }

    const success = await authenticate(pin);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  const handleBiometricUnlock = async () => {
    setBiometricLoading(true);
    setError('');
    
    try {
      const success = await unlockWithBiometric();
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Biometric authentication failed');
      }
    } catch (err) {
      setError('Biometric authentication failed');
    } finally {
      setBiometricLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const isLocked = remainingTime > 0;

  return (
    <div className={`min-h-screen ${isLocked ? 'bg-gradient-to-br from-red-100 via-red-50 to-pink-50' : 'bg-gradient-to-br from-blue-100 via-blue-50 to-purple-50'} flex items-center justify-center p-4 transition-all duration-500`}>
      <div className="max-w-md w-full animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className={`w-24 h-24 ${isLocked ? 'bg-red-100 border-2 border-red-300' : 'bg-white'} rounded-full shadow-md flex items-center justify-center ${isLocked ? 'animate-shake' : ''}`}>
            {isLocked ? (
              <AlertTriangle size={48} className="text-red-600" strokeWidth={2} />
            ) : (
              <Logo variant="icon" size={48} />
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold font-heading mb-2 ${isLocked ? 'text-red-700' : 'text-neutral-800'}`}>
            {isLocked ? 'Vault Locked' : 'Welcome Back'}
          </h1>
          <p className={`text-sm ${isLocked ? 'text-red-600' : 'text-neutral-600'}`}>
            {isLocked ? 'Too many failed attempts' : 'Enter your PIN to unlock'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {isLocked ? (
            <div className="text-center animate-fade-in">
              <p className="text-neutral-700 mb-4 text-sm">
                Your vault is temporarily locked
              </p>
              <div className="px-6 py-5 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-bold text-2xl mb-1">
                  {formatTime(remainingTime)}
                </p>
                <p className="text-red-600 text-xs font-medium">Time remaining</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Biometric Unlock Button */}
              {biometricAvailability.available && isBiometricEnabled && (
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  disabled={biometricLoading}
                  className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                >
                  {biometricLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {biometricAvailability.type === 'face' ? (
                        <Scan size={24} className="group-hover:scale-110 transition-transform" />
                      ) : (
                        <Fingerprint size={24} className="group-hover:scale-110 transition-transform" />
                      )}
                      <span>
                        {biometricAvailability.type === 'face' ? 'Unlock with Touch ID' : 'Unlock with Fingerprint'}
                      </span>
                    </>
                  )}
                </button>
              )}

              {/* Divider */}
              {biometricAvailability.available && isBiometricEnabled && (
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-neutral-500 font-medium">OR</span>
                  </div>
                </div>
              )}

              {/* PIN Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    Enter PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="••••"
                    maxLength={6}
                    autoFocus={!(biometricAvailability.available && isBiometricEnabled)}
                    required
                  />
                </div>

                {error && (
                  <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs animate-shake">
                    <p className="font-semibold">{error}</p>
                    {failedAttempts > 0 && (
                      <p className="mt-1 text-red-600">
                        Failed attempts: {failedAttempts}/5
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-neutral-600 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Unlock with PIN
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className={`mt-4 text-center text-xs ${isLocked ? 'text-red-600' : 'text-neutral-500'}`}>
          <p>🔒 Your data is encrypted and stored locally</p>
        </div>
      </div>
    </div>
  );
};
