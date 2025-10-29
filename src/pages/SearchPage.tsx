import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../contexts/VaultContext';
import { useAuth } from '../contexts/AuthContext';
import { RecordData, DataType } from '../types';
import { ArrowLeft, Search as SearchIcon, X, Lock } from 'lucide-react';
import { SecurityBadge } from '../components/SecurityBadge';
import { CategoryIcon } from '../components/CategoryIcon';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { searchRecords } = useVault();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RecordData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setIsSearching(true);
        const searchResults = searchRecords(query);
        setResults(searchResults);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchRecords]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Clear search on Escape
      if (e.key === 'Escape') {
        if (query) {
          setQuery('');
        } else {
          navigate(-1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [query, navigate]);

  const getRecordTitle = (record: RecordData): string => {
    switch (record.type) {
      case 'card':
        return `${record.bankName} - ${record.cardType.toUpperCase()} - ${record.cardholderName}`;
      case 'netbanking':
        return `${record.bankName} - ${record.accountHolderName}`;
      case 'note':
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
      default:
        return '';
    }
  };

  const categoryNames: Record<DataType, string> = {
    card: 'Card',
    netbanking: 'Net Banking',
    note: 'Note',
    password: 'Password',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200">
      {/* Header */}
      <div className="glass-effect border-b border-neutral-200/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-neutral-200/50 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={24} className="text-neutral-700" />
            </button>
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                <SearchIcon size={20} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across all records... (ESC to clear)"
                className="input-field w-full pl-12 pr-12 shadow-sm"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50 rounded-lg p-1.5 transition-all"
                  title="Clear search (ESC)"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {!query ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="mb-6 flex justify-center">
              <div className="p-5 glass-effect rounded-2xl shadow-md">
                <SearchIcon size={72} className="text-primary-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3 font-heading">Search Your Vault</h3>
            <p className="text-neutral-600 text-lg">
              Type in the search box to find cards, net banking, notes, and more
            </p>
          </div>
        ) : isSearching ? (
          <div className="text-center py-16 text-neutral-600 animate-pulse">Searching...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="mb-6 flex justify-center">
              <div className="p-5 glass-effect rounded-2xl shadow-md">
                <SearchIcon size={72} className="text-neutral-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3 font-heading">No Results Found</h3>
            <p className="text-neutral-600 mb-6">Try different keywords or check your spelling</p>
            {!isAuthenticated && (
              <div className="max-w-md mx-auto mt-6 p-5 glass-effect bg-amber-50 border-2 border-amber-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                    <Lock size={24} className="text-amber-600" />
                  </div>
                  <div className="text-sm text-left">
                    <p className="font-semibold text-amber-900 mb-2">Not finding what you're looking for?</p>
                    <p className="text-amber-800 leading-relaxed">
                      Unlock your vault to search through Cards and Net Banking records. 
                      Click on Cards or Net Banking category to authenticate.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm text-neutral-600 mb-5">
              Found <span className="font-semibold text-primary-700">{results.length}</span> result{results.length !== 1 ? 's' : ''}
            </p>
            {results.map((record) => (
              <button
                key={record.id}
                onClick={() => navigate(`/record/${record.id}`)}
                className="card-interactive w-full text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shadow-sm flex-shrink-0 ${
                    record.type === 'card' ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600' :
                    record.type === 'netbanking' ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600' :
                    'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500'
                  }`}>
                    <CategoryIcon type={record.type} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-lg font-semibold text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
                        {getRecordTitle(record)}
                      </h3>
                      <SecurityBadge isPrivate={record.isPrivate} />
                    </div>
                    <p className="text-sm text-neutral-600 mb-1 font-medium">{categoryNames[record.type]}</p>
                    <p className="text-sm text-neutral-500 truncate">{getRecordSubtitle(record)}</p>
                    {record.tags && record.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {record.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="badge-neutral"
                          >
                            {tag}
                          </span>
                        ))}
                        {record.tags.length > 3 && (
                          <span className="text-xs text-neutral-500 font-medium">
                            +{record.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
