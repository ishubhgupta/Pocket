import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVault } from '../contexts/VaultContext';
import { useSyncContext } from '../contexts/SyncContext';
import { storageService } from '../services/storage.service';
import { dataPortabilityService } from '../services/dataPortability.service';
import { ArrowLeft, Download, Upload, Trash2, Lock, Unlock, Info, Shield, Search, Cloud, CloudOff, Fingerprint, Scan } from 'lucide-react';
import animateExpandAndNavigate from '../utils/searchAnim';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { QuickAccessFAB } from '../components/QuickAccessFAB';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { lock, getMasterKey, isAuthenticated, biometricAvailability, isBiometricEnabled, enrollBiometric, disableBiometric } = useAuth();
  const { privateRecords, publicRecords } = useVault();
  const { isSignedIn } = useSyncContext();
  const [showClearModal, setShowClearModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  const totalRecords = privateRecords.length + publicRecords.length;
  const privateCount = privateRecords.length;
  const publicCount = publicRecords.length;

  const handleExport = async () => {
    try {
      await dataPortabilityService.exportData();
      setToast({ message: 'Backup exported successfully!', type: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: 'Failed to export backup', type: 'error' });
    }
  };

  const handleExportEncrypted = async () => {
    try {
      const masterKey = getMasterKey();
      if (!masterKey) {
        setToast({ message: 'Please unlock the vault first', type: 'error' });
        return;
      }

      await dataPortabilityService.exportEncryptedBackup(masterKey);
      setToast({ message: 'Encrypted backup exported successfully!', type: 'success' });
    } catch (error) {
      console.error('Encrypted export error:', error);
      setToast({ message: 'Failed to export encrypted backup', type: 'error' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const result = await dataPortabilityService.importData(file);

      if (!result.success || result.errors.length > 0) {
        const errorMsg = result.errors.join(', ') || 'Unknown error';
        setToast({ 
          message: `Import completed with errors: ${errorMsg}. Imported: ${result.imported}, Skipped: ${result.skipped}`, 
          type: 'error' 
        });
      } else {
        setToast({ 
          message: `Successfully imported ${result.imported} record(s). Skipped ${result.skipped} duplicate(s). Please reload.`, 
          type: 'success' 
        });
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error('Import error:', error);
      setToast({ message: 'Failed to import backup. Invalid file format.', type: 'error' });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleImportEncrypted = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const masterKey = getMasterKey();
      if (!masterKey) {
        setToast({ message: 'Please unlock the vault first', type: 'error' });
        setIsImporting(false);
        event.target.value = '';
        return;
      }

      const result = await dataPortabilityService.importEncryptedBackup(file, masterKey);

      if (!result.success || result.errors.length > 0) {
        const errorMsg = result.errors.join(', ') || 'Unknown error';
        setToast({ 
          message: `Import completed with errors: ${errorMsg}. Imported: ${result.imported}, Skipped: ${result.skipped}`, 
          type: 'error' 
        });
      } else {
        setToast({ 
          message: `Successfully imported ${result.imported} record(s). Skipped ${result.skipped} duplicate(s). Please reload.`, 
          type: 'success' 
        });
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error('Encrypted import error:', error);
      setToast({ message: 'Failed to import encrypted backup. Check your PIN and file.', type: 'error' });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleClearAll = async () => {
    try {
      await storageService.clearAll();
      setToast({ message: 'All data cleared. Redirecting...', type: 'success' });
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setToast({ message: 'Failed to clear data', type: 'error' });
    }
  };

  const handleToggleBiometric = async () => {
    if (!isAuthenticated) {
      setToast({ message: 'Please unlock the vault first', type: 'error' });
      return;
    }

    setIsBiometricLoading(true);
    try {
      if (isBiometricEnabled) {
        await disableBiometric();
        setToast({ message: 'Biometric authentication disabled', type: 'success' });
      } else {
        await enrollBiometric();
        setToast({ message: `${biometricAvailability.type === 'face' ? 'Touch ID' : 'Fingerprint'} enabled successfully!`, type: 'success' });
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
      setToast({ 
        message: isBiometricEnabled ? 'Failed to disable biometric' : 'Failed to enable biometric authentication', 
        type: 'error' 
      });
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200">
      {/* Header */}
      <div className="glass-effect border-b border-neutral-200/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-neutral-200/50 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <ArrowLeft size={24} className="text-neutral-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 font-heading">Settings</h1>
                <p className="text-sm text-neutral-600">Manage your vault</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => animateExpandAndNavigate(e.currentTarget as HTMLElement, '/search', navigate)}
                className="p-2.5 glass-effect hover:bg-primary-50 text-primary-600 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
                aria-label="Search"
              >
                <Search size={22} />
              </button>
              <button
                onClick={() => navigate('/sync')}
                className={`p-2.5 glass-effect rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm ${
                  isSignedIn 
                    ? 'hover:bg-green-50 text-green-600' 
                    : 'hover:bg-neutral-200/50 text-neutral-700'
                }`}
                aria-label="Cloud Sync"
                title={isSignedIn ? 'Sync Active' : 'Enable Sync'}
              >
                {isSignedIn ? <Cloud size={22} /> : <CloudOff size={22} />}
              </button>
              <button
                onClick={lock}
                className={`p-2.5 glass-effect rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm ${
                  isAuthenticated 
                    ? 'hover:bg-green-50 text-green-600' 
                    : 'hover:bg-red-50 text-red-600'
                }`}
                aria-label="Lock"
              >
                {isAuthenticated ? (
                  <Unlock size={22} className="animate-pulse" />
                ) : (
                  <Lock size={22} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
        {/* Statistics */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-5 font-heading">📊 Vault Statistics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 glass-effect rounded-xl">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent font-heading">{totalRecords}</div>
              <div className="text-sm text-neutral-600 mt-2 font-medium">Total Records</div>
            </div>
            <div className="text-center p-4 glass-effect rounded-xl">
              <div className="text-4xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent font-heading">{privateCount}</div>
              <div className="text-sm text-neutral-600 mt-2 font-medium">Private</div>
            </div>
            <div className="text-center p-4 glass-effect rounded-xl">
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent font-heading">{publicCount}</div>
              <div className="text-sm text-neutral-600 mt-2 font-medium">Public</div>
            </div>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-5 font-heading">💾 Backup & Restore</h2>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="card-interactive w-full text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
                  <Download size={24} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="text-neutral-900 font-semibold">Export Backup (JSON)</div>
                  <div className="text-sm text-neutral-600">Download all data in JSON format</div>
                </div>
              </div>
            </button>

            <button
              onClick={handleExportEncrypted}
              className="card-interactive w-full text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <Shield size={24} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-neutral-900 font-semibold">Export Encrypted Backup</div>
                  <div className="text-sm text-neutral-600">Download password-protected backup</div>
                </div>
              </div>
            </button>

            <label className="card-interactive w-full cursor-pointer group block">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                  <Upload size={24} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="text-neutral-900 font-semibold">Import Backup (JSON)</div>
                  <div className="text-sm text-neutral-600">{isImporting ? 'Importing...' : 'Restore from JSON file'}</div>
                </div>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
            </label>

            <label className="card-interactive w-full cursor-pointer group block">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-100 rounded-xl group-hover:bg-teal-200 transition-colors">
                  <Shield size={24} className="text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="text-neutral-900 font-semibold">Import Encrypted Backup</div>
                  <div className="text-sm text-neutral-600">{isImporting ? 'Importing...' : 'Restore from encrypted file'}</div>
                </div>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleImportEncrypted}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
          
          {/* Migration Info */}
          <div className="mt-5 p-4 glass-effect bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex gap-3">
              <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1.5">Data Portability & Migration</p>
                <p className="text-blue-700 leading-relaxed">
                  Your backups are version-tagged and support automatic migration. Old account records 
                  will be converted to notes with special tags during import.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-5 font-heading">🔒 Security</h2>
          <div className="space-y-3">
            {/* Biometric Authentication */}
            {biometricAvailability.available ? (
              <div className="card-interactive w-full group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-colors ${
                    isBiometricEnabled 
                      ? 'bg-gradient-to-br from-primary-100 to-purple-100' 
                      : 'bg-neutral-100 group-hover:bg-neutral-200'
                  }`}>
                    {biometricAvailability.type === 'face' ? (
                      <Scan size={24} className={isBiometricEnabled ? 'text-primary-600' : 'text-neutral-600'} />
                    ) : (
                      <Fingerprint size={24} className={isBiometricEnabled ? 'text-primary-600' : 'text-neutral-600'} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-neutral-900 font-semibold">
                      {biometricAvailability.type === 'face' ? 'Touch ID' : 'Fingerprint'}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {isBiometricEnabled ? 'Enabled' : 'Quick unlock with biometric'}
                    </div>
                  </div>
                  <button
                    onClick={handleToggleBiometric}
                    disabled={isBiometricLoading || !isAuthenticated}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                      isBiometricEnabled 
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600' 
                        : 'bg-neutral-300'
                    } ${isBiometricLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                        isBiometricEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    >
                      {isBiometricLoading && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 glass-effect bg-neutral-100 border border-neutral-200 rounded-xl">
                <div className="flex gap-3">
                  <Info size={18} className="text-neutral-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-neutral-700">
                    <p className="font-semibold mb-1">Biometric Not Available</p>
                    <p className="text-neutral-600">
                      Your device doesn't support biometric authentication or it's not configured.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lock Vault */}
            <button
              onClick={lock}
              className="card-interactive w-full text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
                  <Lock size={24} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="text-neutral-900 font-semibold">Lock Vault</div>
                  <div className="text-sm text-neutral-600">Secure your data immediately</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-2 border-red-300 bg-red-50">
          <h2 className="text-lg font-semibold text-red-700 mb-5 font-heading">⚠️ Danger Zone</h2>
          <button
            onClick={() => setShowClearModal(true)}
            className="w-full flex items-center gap-4 px-5 py-4 bg-red-100 hover:bg-red-200 border-2 border-red-300 rounded-xl transition-all hover:scale-[1.02] active:scale-98"
          >
            <div className="p-3 bg-red-200 rounded-xl">
              <Trash2 size={24} className="text-red-700" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-red-900 font-semibold">Clear All Data</div>
              <div className="text-sm text-red-700">Permanently delete everything</div>
            </div>
          </button>
        </div>
      </div>

      {/* Clear Data Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAll}
        title="Clear All Data"
        message="Are you sure you want to delete ALL data? This will remove all records, settings, and your PIN. This action cannot be undone. Make sure you have a backup!"
        confirmText="Delete Everything"
        cancelText="Cancel"
        type="danger"
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Quick Access FAB */}
      <QuickAccessFAB />
    </div>
  );
};
