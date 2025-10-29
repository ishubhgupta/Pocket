import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSyncContext } from '../contexts/SyncContext';
import { ArrowLeft, Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, LogOut, User } from 'lucide-react';
import { Toast } from '../components/Toast';

export const SyncSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSignedIn, isSyncing, lastSyncTime, signInWithGoogle, signOut, syncNow, resetAndSync, syncResult } = useSyncContext();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      setToast({ message: 'Successfully signed in with Google!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to sign in. Please try again.', type: 'error' });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setToast({ message: 'Successfully signed out', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to sign out', type: 'error' });
    }
  };

  const handleSync = async () => {
    try {
      await syncNow();
      if (syncResult && syncResult.errors.length === 0) {
        setToast({ message: 'Sync completed successfully!', type: 'success' });
      } else {
        setToast({ message: 'Sync completed with some errors', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Sync failed', type: 'error' });
    }
  };

  const handleResetAndSync = async () => {
    try {
      await resetAndSync();
      setToast({ message: 'Sync reset and completed!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Reset sync failed', type: 'error' });
    }
  };

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200">
      {/* Header */}
      <div className="glass-effect border-b border-neutral-200/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-neutral-200/50 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={24} className="text-neutral-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 font-heading">Cloud Sync</h1>
              <p className="text-sm text-neutral-600">Sync your data across devices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Sign In Section */}
        {!isSignedIn ? (
          <div className="card animate-slide-up">
            <div className="text-center py-8">
              <div className="mb-6 flex justify-center">
                <div className="p-5 glass-effect rounded-2xl shadow-md">
                  <CloudOff size={72} className="text-neutral-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-3 font-heading">Cloud Sync Disabled</h2>
              <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                Sign in with your Google account to enable automatic sync across all your devices. Your data remains encrypted.
              </p>
              <button
                onClick={handleSignIn}
                className="btn-primary inline-flex items-center gap-3 shadow-lg hover:shadow-xl text-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
              
              <div className="mt-8 pt-8 border-t border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">🔒 Privacy First</h3>
                <ul className="text-sm text-neutral-600 space-y-2 text-left max-w-md mx-auto">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Your data is encrypted before uploading to cloud</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Only you can decrypt your sensitive information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Automatic sync keeps all devices up-to-date</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* User Info Card */}
            <div className="card animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-16 h-16 rounded-full border-2 border-primary-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <User size={32} className="text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{user?.displayName || 'User'}</h3>
                    <p className="text-sm text-neutral-600">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-700 font-medium">Connected</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105 active:scale-95"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>

            {/* Sync Status Card */}
            <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">Sync Status</h3>
                <p className="text-sm text-neutral-600">Last synced: {formatLastSyncTime(lastSyncTime)}</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  onClick={handleResetAndSync}
                  disabled={isSyncing}
                  className="btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full text-sm"
                  title="Reset sync and download everything from cloud"
                >
                  <AlertCircle size={16} />
                  Reset & Sync
                </button>
              </div>

              {syncResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center">
                      <div className="text-2xl font-bold text-blue-700 mb-1">{syncResult.uploaded}</div>
                      <div className="text-xs text-blue-600 font-medium">Uploaded</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl text-center">
                      <div className="text-2xl font-bold text-green-700 mb-1">{syncResult.downloaded}</div>
                      <div className="text-xs text-green-600 font-medium">Downloaded</div>
                    </div>
                  </div>
                  {syncResult.errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900 mb-1">Sync Errors</p>
                          {syncResult.errors.map((error, idx) => (
                            <p key={idx} className="text-xs text-red-700">{error}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">How Cloud Sync Works</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Cloud size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Automatic Synchronization</p>
                    <p className="text-xs text-neutral-600 mt-1">Your data automatically syncs when you sign in or make changes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">End-to-End Encryption</p>
                    <p className="text-xs text-neutral-600 mt-1">All data is encrypted with your PIN before uploading to cloud</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCw size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Conflict Resolution</p>
                    <p className="text-xs text-neutral-600 mt-1">Newest changes are kept when same record is modified on multiple devices</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
