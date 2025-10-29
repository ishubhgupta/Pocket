import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVault } from '../contexts/VaultContext';
import { useAuth } from '../contexts/AuthContext';
import { RecordData, DataType } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';
import { SecurityBadge } from '../components/SecurityBadge';
import { PrivateDataGuard } from '../components/PrivateDataGuard';
import { ArrowLeft, Plus, Eye, Search, X } from 'lucide-react';

export const CategoryListPage: React.FC = () => {
  const { type } = useParams<{ type: DataType }>();
  const navigate = useNavigate();
  const { privateRecords, publicRecords, loading } = useVault();
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<'all' | 'private' | 'public'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cards, Netbanking, and Passwords are ALWAYS secured - require authentication immediately
  const isSecuredCategory = type === 'card' || type === 'netbanking' || type === 'password';
  
  // For notes, show all public by default, private requires separate tab with auth
  const isNotesCategory = type === 'note';
  const [showPrivateNotes, setShowPrivateNotes] = useState(false);

  // Keyboard shortcut for search
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Focus search on Ctrl/Cmd + F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Clear search on Escape
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [searchQuery]);

  const categoryNames: Record<DataType, string> = {
    card: 'Cards',
    netbanking: 'Net Banking',
    note: 'Notes',
    password: 'Passwords',
  };

  const getRecords = (): RecordData[] => {
    const allRecords = [...privateRecords, ...publicRecords].filter(
      (r) => r.type === type
    );

    // For notes, filter based on showPrivateNotes tab
    if (isNotesCategory) {
      if (showPrivateNotes) {
        // Show only private notes when Private tab is active
        return allRecords.filter(r => r.isPrivate);
      } else {
        // Show only public notes when All tab is active
        return allRecords.filter(r => !r.isPrivate);
      }
    }

    // For other categories, apply privacy filter
    let filtered = allRecords;
    if (filter === 'private') {
      filtered = allRecords.filter((r) => r.isPrivate);
    } else if (filter === 'public') {
      filtered = allRecords.filter((r) => !r.isPrivate);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((record) => {
        // Search in different fields based on record type
        switch (record.type) {
          case 'card':
            return (
              record.bankName?.toLowerCase().includes(query) ||
              record.cardType?.toLowerCase().includes(query) ||
              record.cardholderName?.toLowerCase().includes(query) ||
              record.cardNumber?.includes(query) ||
              (record.cardPin && record.cardPin.includes(query)) ||
              (record.tags && record.tags.some(tag => tag.toLowerCase().includes(query)))
            );
          case 'netbanking':
            return (
              record.bankName?.toLowerCase().includes(query) ||
              record.accountHolderName?.toLowerCase().includes(query) ||
              record.loginId?.toLowerCase().includes(query) ||
              (record.accountNumber && record.accountNumber.includes(query)) ||
              (record.url && record.url.toLowerCase().includes(query)) ||
              (record.tags && record.tags.some(tag => tag.toLowerCase().includes(query)))
            );
          case 'note':
            return (
              record.title?.toLowerCase().includes(query) ||
              record.content?.toLowerCase().includes(query) ||
              (record.tags && record.tags.some(tag => tag.toLowerCase().includes(query)))
            );
          case 'password':
            return (
              record.title?.toLowerCase().includes(query) ||
              record.username?.toLowerCase().includes(query) ||
              (record.url && record.url.toLowerCase().includes(query)) ||
              (record.tags && record.tags.some(tag => tag.toLowerCase().includes(query)))
            );
          default:
            return false;
        }
      });
    }

    return filtered;
  };

  const records = getRecords();

  const getRecordTitle = (record: RecordData): string => {
    switch (record.type) {
      case 'card':
        return `${record.bankName} - ${record.cardType.toUpperCase()} - ${record.cardholderName}`;
      case 'netbanking':
        return `${record.bankName} - ${record.accountHolderName}`;
      case 'note':
        return record.title;
      case 'password':
        return record.title;
      default:
        return 'Unknown';
    }
  };

  const getRecordSubtitle = (record: RecordData): string => {
    switch (record.type) {
      case 'card':
        return `**** **** **** ${record.cardNumber.slice(-4)}`;
      case 'netbanking':
        return record.loginId;
      case 'note':
        return record.content.slice(0, 60) + (record.content.length > 60 ? '...' : '');
      case 'password':
        return ''; // Don't show subtitle for passwords
      default:
        return '';
    }
  };

  if (!type) {
    return null;
  }

  const pageContent = (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200">
      {/* Header */}
      <div className="glass-effect border-b border-neutral-200/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-neutral-200/50 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={24} className="text-neutral-700" />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-md">
                <CategoryIcon type={type} size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 font-heading">{categoryNames[type]}</h1>
                <p className="text-sm text-neutral-600">{records.length} items</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/add/${type}`)}
              className="p-2.5 btn-primary shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={24} className="text-white" />
            </button>
          </div>

          {/* Filter Tabs - Only show for Notes */}
          {!isSecuredCategory && (
            <div className="flex gap-2 mb-4">
              {isNotesCategory ? (
                // Special tabs for Notes: All (public) and Private
                <>
                  <button
                    onClick={() => setShowPrivateNotes(false)}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                      !showPrivateNotes
                        ? 'btn-primary shadow-md'
                        : 'glass-effect text-neutral-700 hover:bg-neutral-200/50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        // Will be handled by PrivateDataGuard below
                        setShowPrivateNotes(true);
                      } else {
                        setShowPrivateNotes(true);
                      }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                      showPrivateNotes
                        ? 'btn-primary shadow-md'
                        : 'glass-effect text-neutral-700 hover:bg-neutral-200/50'
                    }`}
                  >
                    Private
                  </button>
                </>
              ) : (
                // Private/Public tabs only for Notes
                <>
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                      filter === 'all'
                        ? 'btn-primary shadow-md'
                        : 'glass-effect text-neutral-700 hover:bg-neutral-200/50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('private')}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                      filter === 'private'
                        ? 'btn-primary shadow-md'
                        : 'glass-effect text-neutral-700 hover:bg-neutral-200/50'
                    }`}
                  >
                    Private
                  </button>
                  <button
                    onClick={() => setFilter('public')}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                      filter === 'public'
                        ? 'btn-primary shadow-md'
                        : 'glass-effect text-neutral-700 hover:bg-neutral-200/50'
                    }`}
                  >
                    Public
                  </button>
                </>
              )}
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
            <input
              type="text"
              placeholder={`Search ${categoryNames[type].toLowerCase()}... (Ctrl+F)`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-12 pr-12 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50 rounded-lg transition-all"
                title="Clear search (ESC)"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Results Info */}
        {searchQuery && !loading && records.length > 0 && (
          <div className="mb-5 text-sm text-neutral-600 animate-fade-in">
            Found <span className="text-primary-700 font-semibold">{records.length}</span> result{records.length !== 1 ? 's' : ''} for "<span className="text-neutral-900 font-medium">{searchQuery}</span>"
          </div>
        )}

        {loading ? (
          <div className="text-center text-neutral-600 py-16 animate-pulse">Loading...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="mb-6 flex justify-center">
              <div className="p-5 glass-effect rounded-2xl shadow-md">
                <CategoryIcon type={type} size={72} />
              </div>
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 font-heading">No Results Found</h3>
                <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                  No {categoryNames[type].toLowerCase()} match your search for "<span className="text-neutral-900 font-medium">{searchQuery}</span>"
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="btn-secondary inline-flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                >
                  <X size={20} />
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 font-heading">
                  No {isNotesCategory && showPrivateNotes ? 'Private ' : ''}{categoryNames[type]} Yet
                </h3>
                <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                  {isNotesCategory && showPrivateNotes 
                    ? 'Add your first private note to get started'
                    : `Add your first ${categoryNames[type].toLowerCase()} to get started`
                  }
                </p>
                <button
                  onClick={() => navigate(`/add/${type}`)}
                  className="btn-primary inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus size={20} />
                  Add {categoryNames[type]}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {records.map((record) => (
              <button
                key={record.id}
                onClick={() => navigate(`/record/${record.id}`)}
                className="card-interactive w-full text-left group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-lg font-semibold text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
                        {getRecordTitle(record)}
                      </h3>
                      <SecurityBadge isPrivate={record.isPrivate} />
                    </div>
                    <p className="text-sm text-neutral-600 truncate">{getRecordSubtitle(record)}</p>
                    {record.tags && record.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {record.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="badge-neutral"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Eye size={20} className="text-neutral-400 group-hover:text-primary-600 flex-shrink-0 mt-1 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Cards and Netbanking ALWAYS require authentication - wrap entire page
  if (isSecuredCategory && !isAuthenticated) {
    return (
      <PrivateDataGuard>
        {pageContent}
      </PrivateDataGuard>
    );
  }

  // For notes, wrap with auth guard only when viewing Private tab
  if (isNotesCategory && showPrivateNotes && !isAuthenticated) {
    return (
      <PrivateDataGuard>
        {pageContent}
      </PrivateDataGuard>
    );
  }

  // Show page normally for authenticated users or non-secured categories
  return pageContent;
};
