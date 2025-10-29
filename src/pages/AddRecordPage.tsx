import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVault } from '../contexts/VaultContext';
import { useAuth } from '../contexts/AuthContext';
import { DataType, CardData, NetbankingData, NoteData, PasswordData, NoteField } from '../types';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { Toast } from '../components/Toast';
import { PrivateDataGuard } from '../components/PrivateDataGuard';

export const AddRecordPage: React.FC = () => {
  const { type } = useParams<{ type?: DataType }>();
  const navigate = useNavigate();
  const { addRecord } = useVault();
  const { isAuthenticated } = useAuth();
  
  // Cards, Netbanking, and Passwords are ALWAYS private. Notes are public by default.
  const isSecuredCategory = type === 'card' || type === 'netbanking' || type === 'password';
  const defaultPrivacy = type === 'note' ? false : true;
  const [isPrivate, setIsPrivate] = useState(defaultPrivacy);
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
  const [profilePassword, setProfilePassword] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');

  // Password fields
  const [passwordTitle, setPasswordTitle] = useState('');
  const [passwordUrl, setPasswordUrl] = useState('');
  const [passwordUsername, setPasswordUsername] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  // Note fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteFields, setNoteFields] = useState<NoteField[]>([]);

  const addNoteField = () => {
    setNoteFields([...noteFields, { id: Date.now().toString(), label: '', value: '' }]);
  };

  const updateNoteField = (id: string, field: 'label' | 'value', newValue: string) => {
    setNoteFields(noteFields.map(f => f.id === id ? { ...f, [field]: newValue } : f));
  };

  const removeNoteField = (id: string) => {
    setNoteFields(noteFields.filter(f => f.id !== id));
  };

  const categoryNames: Record<DataType, string> = {
    card: 'Card',
    netbanking: 'Net Banking',
    note: 'Note',
    password: 'Password',
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
            profilePassword: profilePassword || undefined,
            transactionPassword: transactionPassword || undefined,
          } as Omit<NetbankingData, 'id' | 'createdAt' | 'updatedAt'>;
          break;
        case 'password':
          recordData = {
            type: 'password',
            isPrivate: finalIsPrivate,
            tags: tagArray,
            title: passwordTitle,
            url: passwordUrl || undefined,
            username: passwordUsername,
            password: passwordValue,
          } as Omit<PasswordData, 'id' | 'createdAt' | 'updatedAt'>;
          break;
        case 'note':
          recordData = {
            type: 'note',
            isPrivate: finalIsPrivate,
            tags: tagArray,
            title,
            content,
            fields: noteFields.filter(f => f.label || f.value), // Only include non-empty fields
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
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Profile Password (Optional)
                </label>
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="For profile login if different"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Transaction Password (Optional)
                </label>
                <input
                  type="password"
                  value={transactionPassword}
                  onChange={(e) => setTransactionPassword(e.target.value)}
                  placeholder="For transactions if different"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                />
              </div>
            </>
          )}

          {type === 'password' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={passwordTitle}
                  onChange={(e) => setPasswordTitle(e.target.value)}
                  placeholder="Gmail, Facebook, etc."
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  value={passwordUrl}
                  onChange={(e) => setPasswordUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Username / Email *
                </label>
                <input
                  type="text"
                  value={passwordUsername}
                  onChange={(e) => setPasswordUsername(e.target.value)}
                  placeholder="user@example.com"
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
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  required
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
                  placeholder="My Note Title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900 resize-none"
                  placeholder="General notes or description..."
                />
              </div>

              {/* Custom Fields */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-neutral-700">
                    Custom Fields (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={addNoteField}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Add Field
                  </button>
                </div>
                
                {noteFields.length === 0 && (
                  <div className="text-center py-6 bg-neutral-50 border border-neutral-200 border-dashed rounded-lg">
                    <p className="text-sm text-neutral-500">
                      Add custom fields like "Aadhar Number", "PAN", etc.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {noteFields.map((field) => (
                    <div key={field.id} className="card p-4">
                      <div className="flex gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateNoteField(field.id, 'label', e.target.value)}
                            placeholder="Field Name (e.g., Aadhar Number)"
                            className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => updateNoteField(field.id, 'value', e.target.value)}
                            placeholder="Value"
                            className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNoteField(field.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
