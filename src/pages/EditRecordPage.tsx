import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVault } from '../contexts/VaultContext';
import { useAuth } from '../contexts/AuthContext';
import { RecordData, DataType, NoteField } from '../types';
import { storageService } from '../services/storage.service';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { Toast } from '../components/Toast';
import { PrivateDataGuard } from '../components/PrivateDataGuard';

export const EditRecordPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { privateRecords, publicRecords, updateRecord } = useVault();
  const { isAuthenticated } = useAuth();
  const [record, setRecord] = useState<RecordData | null>(null);
  const [isPrivateRecord, setIsPrivateRecord] = useState<boolean | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [isPrivate, setIsPrivate] = useState(true);
  const [tags, setTags] = useState('');

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
  const [noteFields, setNoteFields] = useState<NoteField[]>([]);

  // Password fields
  const [passwordTitle, setPasswordTitle] = useState('');
  const [passwordUrl, setPasswordUrl] = useState('');
  const [passwordUsername, setPasswordUsername] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  // Netbanking additional fields
  const [profilePassword, setProfilePassword] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');

  const addNoteField = () => {
    setNoteFields([...noteFields, { id: Date.now().toString(), label: '', value: '' }]);
  };

  const updateNoteField = (id: string, field: 'label' | 'value', newValue: string) => {
    setNoteFields(noteFields.map(f => f.id === id ? { ...f, [field]: newValue } : f));
  };

  const removeNoteField = (id: string) => {
    setNoteFields(noteFields.filter(f => f.id !== id));
  };

  // Cards, Netbanking, and Passwords are ALWAYS private
  const isSecuredCategory = record?.type === 'card' || record?.type === 'netbanking' || record?.type === 'password';

  // Check if record is private
  useEffect(() => {
    const checkRecordPrivacy = async () => {
      try {
        const storedRecord = await storageService.getRecord(Number(id));
        if (storedRecord) {
          setIsPrivateRecord(storedRecord.isPrivate);
        }
      } catch (error) {
        console.error('Failed to check record privacy:', error);
      }
    };
    checkRecordPrivacy();
  }, [id]);

  // Load record data
  useEffect(() => {
    const allRecords = [...privateRecords, ...publicRecords];
    const found = allRecords.find((r) => r.id === Number(id));
    
    if (found) {
      setRecord(found);
      setIsPrivate(found.isPrivate);
      setTags(found.tags?.join(', ') || '');

      // Populate fields based on record type
      switch (found.type) {
        case 'card':
          setCardNumber(found.cardNumber);
          setExpiryDate(found.expiryDate);
          setCvv(found.cvv);
          setCardPin(found.cardPin);
          setCardholderName(found.cardholderName);
          setBankName(found.bankName);
          setCardType(found.cardType);
          break;
        case 'netbanking':
          setNetBankName(found.bankName);
          setNetAccountHolderName(found.accountHolderName);
          setLoginId(found.loginId);
          setPassword(found.password);
          setUrl(found.url);
          setAccountNumber(found.accountNumber || '');
          setProfilePassword(found.profilePassword || '');
          setTransactionPassword(found.transactionPassword || '');
          break;
        case 'note':
          setTitle(found.title);
          setContent(found.content);
          setNoteFields(found.fields || []);
          break;
        case 'password':
          setPasswordTitle(found.title);
          setPasswordUrl(found.url || '');
          setPasswordUsername(found.username);
          setPasswordValue(found.password);
          break;
      }
    }
    
    setRecordLoading(false);
  }, [id, privateRecords, publicRecords]);

  // Reload when authentication state changes
  useEffect(() => {
    if (isAuthenticated && !record && isPrivateRecord) {
      setRecordLoading(true);
      setTimeout(() => {
        const allRecords = [...privateRecords, ...publicRecords];
        const found = allRecords.find((r) => r.id === Number(id));
        setRecord(found || null);
        setRecordLoading(false);
      }, 200);
    }
  }, [isAuthenticated, id, privateRecords, publicRecords, record, isPrivateRecord]);

  const categoryNames: Record<DataType, string> = {
    card: 'Card',
    netbanking: 'Net Banking',
    note: 'Note',
    password: 'Password',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!record) return;

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
      
      let updates: Partial<RecordData>;

      switch (record.type) {
        case 'card':
          updates = {
            isPrivate: finalIsPrivate,
            tags: tagArray,
            cardNumber,
            expiryDate,
            cvv,
            cardPin,
            cardholderName,
            bankName,
            cardType,
          };
          break;
        case 'netbanking':
          updates = {
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
          };
          break;
        case 'note':
          updates = {
            isPrivate: finalIsPrivate,
            tags: tagArray,
            title,
            content,
            fields: noteFields.filter(f => f.label || f.value), // Only include non-empty fields
          };
          break;
        case 'password':
          updates = {
            isPrivate: finalIsPrivate,
            tags: tagArray,
            title: passwordTitle,
            url: passwordUrl || undefined,
            username: passwordUsername,
            password: passwordValue,
          };
          break;
        default:
          throw new Error('Unknown record type');
      }

      await updateRecord(record.id, updates);
      setToast({ message: 'Record updated successfully', type: 'success' });
      setTimeout(() => navigate(`/category/${record.type}`), 1500);
    } catch (error) {
      console.error('Failed to update record:', error);
      setToast({ message: 'Failed to update record', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (recordLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 flex items-center justify-center">
        <div className="text-white text-xl">Record not found</div>
      </div>
    );
  }

  // Require authentication for private records
  const requiresAuth = record.isPrivate && !isAuthenticated;

  const pageContent = (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200">
      {/* Header */}
      <div className="glass-effect border-b border-neutral-200/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/category/${record.type}`)}
              className="p-2 hover:bg-neutral-200/50 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={24} className="text-neutral-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 font-heading">Edit {categoryNames[record.type]}</h1>
              <p className="text-sm text-neutral-600">Update your information</p>
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
          {record.type === 'card' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
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
                  required
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
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
                  required
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
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
                    required
                    className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    CVV *
                  </label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    required
                    className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Card PIN
                  </label>
                  <input
                    type="password"
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value)}
                    placeholder="••••"
                    maxLength={6}
                    className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                  />
                </div>
              </div>
            </>
          )}

          {record.type === 'netbanking' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={netBankName}
                  onChange={(e) => setNetBankName(e.target.value)}
                  required
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
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
                  required
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
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
                  required
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
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
                  required
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://netbanking.example.com"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Account Number
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
                  Profile Password
                </label>
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="Optional profile password"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Transaction Password
                </label>
                <input
                  type="password"
                  value={transactionPassword}
                  onChange={(e) => setTransactionPassword(e.target.value)}
                  placeholder="Optional transaction password"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                />
              </div>
            </>
          )}

          {record.type === 'password' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={passwordTitle}
                  onChange={(e) => setPasswordTitle(e.target.value)}
                  required
                  placeholder="e.g., Gmail Account, Work Email"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
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
                  required
                  placeholder="username@example.com"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
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
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
                />
              </div>
            </>
          )}

          {record.type === 'note' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="My Note Title"
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900"
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
                  placeholder="General notes or description..."
                  className="w-full px-4 py-2 input-field rounded-lg text-neutral-900 resize-none"
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
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="personal, work, important"
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
            {saving ? 'Updating...' : 'Update Record'}
          </button>
        </div>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );

  // Wrap content with auth guard if record is private
  if (requiresAuth) {
    return (
      <PrivateDataGuard>
        {pageContent}
      </PrivateDataGuard>
    );
  }

  return pageContent;
};
