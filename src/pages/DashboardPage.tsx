import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVault } from '../contexts/VaultContext';
import { useSyncContext } from '../contexts/SyncContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { Logo } from '../components/Logo';
import { QuickAccessFAB } from '../components/QuickAccessFAB';
import { StarredNotes } from '../components/StarredNotes';
import { Lock, Unlock, Search, Settings, Cloud, CloudOff } from 'lucide-react';
import animateExpandAndNavigate from '../utils/searchAnim';
import { DataType, NoteData } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { lock, isAuthenticated } = useAuth();
  const { privateRecords, publicRecords, loadData } = useVault();
  const { isSignedIn } = useSyncContext();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categories: Array<{ type: DataType; label: string; bgClass: string }> = [
    { type: 'card', label: 'Cards', bgClass: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600' },
    { type: 'netbanking', label: 'Net Banking', bgClass: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600' },
    { type: 'password', label: 'Passwords', bgClass: 'bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600' },
    { type: 'note', label: 'Notes', bgClass: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500' },
  ];

  const getCount = (type: DataType) => {
    const privateCount = privateRecords.filter(r => r.type === type).length;
    const publicCount = publicRecords.filter(r => r.type === type).length;
    return { privateCount, publicCount, total: privateCount + publicCount };
  };

  // Get starred notes
  const starredNotes = [...privateRecords, ...publicRecords]
    .filter((r): r is NoteData => r.type === 'note' && (r as NoteData).isStarred === true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200">
      {/* Header */}
      <div className="glass-effect border-b border-neutral-200/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <Logo variant="full" size={36} onClick={() => navigate('/dashboard')} />
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
              onClick={() => navigate('/settings')}
              className="p-2.5 glass-effect hover:bg-neutral-200/50 text-neutral-700 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
              aria-label="Settings"
            >
              <Settings size={22} />
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 animate-fade-in">
          {categories.map(({ type, label, bgClass }) => {
            const { privateCount, publicCount, total } = getCount(type);
            // Don't show counts for cards and netbanking for privacy
            const showCount = type !== 'card' && type !== 'netbanking';
            
            return (
              <button
                key={type}
                onClick={() => navigate(`/category/${type}`)}
                className="card-interactive group relative overflow-hidden bg-white p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-4 ${bgClass} rounded-2xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <CategoryIcon type={type} size={40} />
                  </div>
                  {showCount && (
                    <div className="text-5xl font-bold text-neutral-800 font-heading">{total}</div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3 font-heading group-hover:text-primary-700 transition-colors">{label}</h3>
                {showCount && (
                  <div className="flex gap-2 text-sm">
                    {privateCount > 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg font-medium">
                        <Lock size={14} />
                        {privateCount} Private
                      </span>
                    )}
                    {publicCount > 0 && (
                      <span className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg font-medium">{publicCount} Public</span>
                    )}
                  </div>
                )}
                {!showCount && (
                  <div className="text-sm">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg font-medium inline-flex">
                      <Lock size={14} />
                      Secure Access Required
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Starred Notes Section */}
        <StarredNotes notes={starredNotes} />
      </div>

      {/* Quick Access FAB */}
      <QuickAccessFAB />
    </div>
  );
};
