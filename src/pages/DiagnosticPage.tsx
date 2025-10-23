import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../contexts/VaultContext';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storage.service';
import { ArrowLeft } from 'lucide-react';
import { StoredRecord } from '../types';

export const DiagnosticPage: React.FC = () => {
  const navigate = useNavigate();
  const { privateRecords, publicRecords, loading } = useVault();
  const { isAuthenticated, masterKey } = useAuth();
  const [rawRecords, setRawRecords] = useState<StoredRecord[]>([]);

  useEffect(() => {
    const loadRawRecords = async () => {
      const records = await storageService.getAllRecords();
      setRawRecords(records);
    };
    loadRawRecords();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Diagnostic Information</h1>
        </div>

        <div className="space-y-4">
          {/* Auth Status */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Authentication Status</h2>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">
                Authenticated: <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                  {isAuthenticated ? 'Yes' : 'No'}
                </span>
              </p>
              <p className="text-gray-300">
                Master Key Available: <span className={masterKey ? 'text-green-400' : 'text-red-400'}>
                  {masterKey ? 'Yes' : 'No'}
                </span>
              </p>
            </div>
          </div>

          {/* Vault Status */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Vault Context Status</h2>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">
                Loading: <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
                  {loading ? 'Yes' : 'No'}
                </span>
              </p>
              <p className="text-gray-300">
                Private Records in Memory: <span className="text-blue-400">{privateRecords.length}</span>
              </p>
              <p className="text-gray-300">
                Public Records in Memory: <span className="text-blue-400">{publicRecords.length}</span>
              </p>
              <p className="text-gray-300">
                Total in Memory: <span className="text-blue-400">{privateRecords.length + publicRecords.length}</span>
              </p>
            </div>
          </div>

          {/* Raw Storage */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Raw IndexedDB Storage</h2>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">
                Total Records in DB: <span className="text-blue-400">{rawRecords.length}</span>
              </p>
              <p className="text-gray-300">
                Private Records in DB: <span className="text-blue-400">
                  {rawRecords.filter(r => r.isPrivate).length}
                </span>
              </p>
              <p className="text-gray-300">
                Public Records in DB: <span className="text-blue-400">
                  {rawRecords.filter(r => !r.isPrivate).length}
                </span>
              </p>
            </div>
          </div>

          {/* Records by Type */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Records by Type (in DB)</h2>
            <div className="space-y-1 text-sm">
              {['card', 'netbanking', 'account', 'note'].map(type => {
                const count = rawRecords.filter(r => r.type === type).length;
                return (
                  <p key={type} className="text-gray-300">
                    {type.charAt(0).toUpperCase() + type.slice(1)}: <span className="text-blue-400">{count}</span>
                  </p>
                );
              })}
            </div>
          </div>

          {/* Raw Records Detail */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Raw Records Detail</h2>
            <div className="space-y-2">
              {rawRecords.length === 0 ? (
                <p className="text-gray-400 text-sm">No records found in database</p>
              ) : (
                rawRecords.map(record => (
                  <div key={record.id} className="bg-slate-700 rounded p-3 text-xs">
                    <p className="text-white">ID: {record.id}</p>
                    <p className="text-gray-300">Type: {record.type}</p>
                    <p className="text-gray-300">
                      Privacy: {record.isPrivate ? (
                        <span className="text-red-400">Private (Encrypted)</span>
                      ) : (
                        <span className="text-green-400">Public</span>
                      )}
                    </p>
                    <p className="text-gray-300">Has Ciphertext: {record.ciphertext ? 'Yes' : 'No'}</p>
                    <p className="text-gray-300">Has IV: {record.iv ? 'Yes' : 'No'}</p>
                    <p className="text-gray-300">Has Plaintext: {record.plaintext ? 'Yes' : 'No'}</p>
                    <p className="text-gray-300">Tags: {record.tags?.join(', ') || 'None'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
