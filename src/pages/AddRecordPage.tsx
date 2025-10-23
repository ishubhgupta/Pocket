import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVault } from '../contexts/VaultContext';
import { useAuth } from '../contexts/AuthContext';
import { DataType, CardData, NetbankingData, NoteData } from '../types';
import { ArrowLeft, Save } from 'lucide-react';
import { Toast } from '../components/Toast';
import { PrivateDataGuard } from '../components/PrivateDataGuard';

export const AddRecordPage: React.FC = () => {
  const { type } = useParams<{ type?: DataType }>();
  const navigate = useNavigate();
  const { addRecord } = useVault();
  const { isAuthenticated } = useAuth();
  
  // Cards and Netbanking are ALWAYS private
  const isSecuredCategory = type === 'card' || type === 'netbanking';
  const [isPrivate, setIsPrivate] = useState(true);
  const [tags, setTags] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardPin, setCardPin] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [cardType, setCardType] = useState<'debit' | 'credit' | 'atm'>('debit');

  // Netbanking fields
  const [netBankName, setNetBankName] = useState('');
  const [netAccountHolderName, setNetAccountHolderName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Note fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const categoryNames: Record<DataType, string> = {
    card: 'Card',
    netbanking: 'Net Banking',
    note: 'Note',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cards and Netbanking are always private, force isPrivate to true
    const finalIsPrivate = isSecuredCategory ? true : isPrivate;
    
    // If trying to save private data and not authenticated, require authentication first
    if (finalIsPrivate && !isAuthenticated) {
      setToast({ message: 'Please authenticate to save private data', type: 'error' });
      return;
    }
    
    setSaving(true);

    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
      
      let recordData: any;

      switch (type) {
        case 'card':
          recordData = {
            type: 'card',
            isPrivate: finalIsPrivate,
            tags: tagArray,
            cardNumber,
            expiryDate,
            cvv,
            cardPin,
            cardholderName,
            bankName,
            cardType,
          } as Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>;
          break;
        case 'netbanking':
          recordData = {
            type: 'netbanking',
            isPrivate: finalIsPrivate,
            tags: tagArray,
            bankName: netBankName,
            accountHolderName: netAccountHolderName,
            loginId,
            password,
            url,
            accountNumber,
          } as Omit<NetbankingData, 'id' | 'createdAt' | 'updatedAt'>;
          break;
        case 'note':
          recordData = {
            type: 'note',
            isPrivate: finalIsPrivate,
            tags: tagArray,
            title,
            content,
          } as Omit<NoteData, 'id' | 'createdAt' | 'updatedAt'>;
          break;
        default:
          throw new Error('Invalid type');
      }

      await addRecord(recordData);
      setToast({ message: 'Record added successfully!', type: 'success' });
      setTimeout(() => navigate(`/category/${type}`), 1500);
    } catch (error) {
      setToast({ message: 'Failed to add record', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!type) {
    return null;
  }

  // Don't require auth for just opening the form - only when saving
  const pageContent = (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 pb-20">
      {/* Header */}
      <div className="glass-effect border-b border-neutral-200/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-neutral-200/50 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={24} className="text-neutral-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 font-heading">Add {categoryNames[type]}</h1>
              <p className="text-sm text-neutral-600">Fill in the details below</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-6">
        <div className="card space-y-6 animate-slide-up">
          {/* Privacy Toggle - Hidden for Cards and Netbanking (always private) */}
          {!isSecuredCategory && (
            <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
              <div>
                <label className="text-neutral-900 font-semibold text-lg">Privacy</label>
                <p className="text-sm text-neutral-600 mt-1">
                  {isPrivate ? 'Encrypted and requires PIN' : 'Accessible without PIN'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative w-16 h-9 rounded-full transition-all shadow-sm ${
                  isPrivate ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full transition-all shadow-md ${
                    isPrivate ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Type-specific fields */}
          {type === 'card' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Card Type *
                </label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value as 'debit' | 'credit' | 'atm')}
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
                >
                  <option value="debit">Debit Card</option>
                  <option value="credit">Credit Card</option>
                  <option value="atm">ATM Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cardholder Name *
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Name as it appears on the card"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Card Number *
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
                  placeholder="1234567890123456"
                  maxLength={16}
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    PIN *
                  </label>
                  <input
                    type="password"
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value)}
                    placeholder="****"
                    maxLength={6}
                    className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {type === 'netbanking' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={netBankName}
                  onChange={(e) => setNetBankName(e.target.value)}
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={netAccountHolderName}
                  onChange={(e) => setNetAccountHolderName(e.target.value)}
                  placeholder="Full name of account holder"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Login ID / Username *
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Website URL *
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://netbanking.example.com"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Account Number (Optional)
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                />
              </div>
            </>
          )}

          {type === 'note' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900 resize-none"
                  required
                />
              </div>
            </>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Tags (Optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="personal, work, important (comma-separated)"
              className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Auth guard that appears when trying to save private data */}
      {isPrivate && !isAuthenticated && (
        <PrivateDataGuard>
          <div /> {/* Empty div - guard will handle the auth flow */}
        </PrivateDataGuard>
      )}
    </div>
  );

  return pageContent;
};
