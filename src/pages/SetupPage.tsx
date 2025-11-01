import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { Fingerprint, Scan } from 'lucide-react';

export const SetupPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const { setupPin, biometricAvailability, enrollBiometric } = useAuth();
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
      // Setup the PIN and get the master key
      console.log('[Setup] Setting up PIN...');
      const newMasterKey = await setupPin(pin);
      console.log('[Setup] PIN setup successful, master key generated');
      
      // Automatically enroll biometric if available (no user choice needed)
      if (biometricAvailability.available) {
        try {
          console.log('[Setup] Biometric available, auto-enrolling...');
          await enrollBiometric(newMasterKey);
          console.log('[Setup] Biometric enrollment successful');
        } catch (bioError) {
          console.error('[Setup] Biometric enrollment failed:', bioError);
          // Don't block setup if biometric enrollment fails
          // User can enable it later from settings
        }
      }
      
      navigate('/dashboard');
    } catch (err) {
      console.error('[Setup] PIN setup failed:', err);
      setError('Failed to setup PIN. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center">
            <Logo variant="icon" size={48} />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-neutral-800 font-heading mb-2">
            Welcome to Pocket
          </h1>
          <p className="text-neutral-600 text-sm">
            Create a secure PIN to protect your data
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                Create PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="••••••"
                maxLength={6}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                Confirm PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="•••••• "
                maxLength={6}
                required
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs animate-shake">
                {error}
              </div>
            )}

            {/* Biometric Info (auto-enabled if available) */}
            {biometricAvailability.available && (
              <div className="pt-2">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-lg">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {biometricAvailability.type === 'face' ? (
                      <Scan size={20} className="text-primary-600" />
                    ) : (
                      <Fingerprint size={20} className="text-primary-600" />
                    )}
                  </div>
                  <div className="text-sm flex-1">
                    <div className="font-semibold text-neutral-800">
                      {biometricAvailability.type === 'face' ? 'Touch ID' : 'Fingerprint'} Detected
                    </div>
                    <div className="text-xs text-neutral-600">
                      Will be automatically enabled for quick unlock
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              Continue
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-center text-xs text-neutral-500">
          <p>🔒 Your data is encrypted and stored locally</p>
        </div>
      </div>
    </div>
  );
};
