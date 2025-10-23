import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, AlertTriangle } from 'lucide-react';

export const UnlockPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const { authenticate, lockUntil, failedAttempts } = useAuth();
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
    <div className={`min-h-screen ${isLocked ? 'bg-gradient-to-br from-red-500 via-red-600 to-pink-600' : 'bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-600'} flex items-center justify-center p-4 transition-all duration-500`}>
      <div className="max-w-md w-full glass-effect backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/20 animate-scale-in">
        <div className="flex flex-col items-center mb-10">
          <div className={`w-24 h-24 ${isLocked ? 'bg-white/10 animate-shake' : 'bg-white/10 animate-unlock'} backdrop-blur-sm rounded-full flex items-center justify-center mb-6 shadow-xl`}>
            {isLocked ? <AlertTriangle size={52} className="text-white" strokeWidth={2.5} /> : <Lock size={52} className="text-white" strokeWidth={2.5} />}
          </div>
          <h1 className="text-4xl font-bold text-white font-heading mb-2">
            {isLocked ? 'Locked' : 'Welcome Back'}
          </h1>
          <p className="text-white/80 text-center leading-relaxed">
            {isLocked ? 'Too many failed attempts' : 'Enter your PIN to unlock'}
          </p>
        </div>

        {isLocked ? (
          <div className="text-center animate-fade-in">
            <p className="text-white/95 mb-6 leading-relaxed text-lg">
              Your vault is temporarily locked
            </p>
            <div className="px-6 py-6 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl">
              <p className="text-white font-bold text-2xl mb-1">
                {formatTime(remainingTime)}
              </p>
              <p className="text-white/70 text-sm">Time remaining</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="animate-slide-up">
              <label className="block text-sm font-semibold text-white/90 mb-3">
                Enter PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white text-center text-4xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 placeholder-white/30 transition-all font-heading"
                placeholder="••••"
                maxLength={6}
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="px-5 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl text-white text-sm font-medium animate-shake">
                <p className="font-semibold">{error}</p>
                {failedAttempts > 0 && (
                  <p className="mt-2 text-white/80">
                    Failed attempts: {failedAttempts}/5
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-5 bg-white hover:bg-white/90 text-primary-700 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl font-heading text-lg"
            >
              Unlock Vault
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-white/70">
          <p>🔒 AES-256 encrypted • 100% offline</p>
        </div>
      </div>
    </div>
  );
};
