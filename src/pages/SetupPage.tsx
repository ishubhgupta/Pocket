import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';

export const SetupPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const { setupPin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      await setupPin(pin);
      navigate('/dashboard');
    } catch {
      setError('Failed to setup PIN. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-effect backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/20 animate-scale-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-28 h-28 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 shadow-xl animate-unlock">
            <Lock size={56} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold text-white font-heading mb-3">Welcome to Pocket</h1>
          <p className="text-white/85 text-center leading-relaxed text-lg">
            Create a secure PIN to protect your data
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="animate-slide-up">
            <label className="block text-sm font-semibold text-white/90 mb-3">
              Create PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white text-center text-4xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 placeholder-white/30 transition-all font-heading"
              placeholder="••••"
              maxLength={6}
              required
            />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <label className="block text-sm font-semibold text-white/90 mb-3">
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full px-4 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white text-center text-4xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 placeholder-white/30 transition-all font-heading"
              placeholder="••••"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="px-5 py-4 bg-red-500/20 backdrop-blur-sm border-2 border-red-400/30 rounded-2xl text-red-100 text-sm font-semibold animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-5 bg-white hover:bg-white/90 text-primary-700 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl font-heading text-lg"
          >
            Create Vault
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-white/75 space-y-1.5">
          <p>🔒 AES-256 encryption • 100% offline</p>
          <p>✨ Your data never leaves your device</p>
        </div>
      </div>
    </div>
  );
};
