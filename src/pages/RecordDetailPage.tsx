import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVault } from '../contexts/VaultContext';
import { useAuth } from '../contexts/AuthContext';
import { RecordData } from '../types';
import { storageService } from '../services/storage.service';
import { ArrowLeft, Trash2, Eye, EyeOff, Edit } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';
import { SecurityBadge } from '../components/SecurityBadge';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { PrivateDataGuard } from '../components/PrivateDataGuard';

export const RecordDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { privateRecords, publicRecords, deleteRecord } = useVault();
  const { isAuthenticated } = useAuth();
  const [record, setRecord] = useState<RecordData | null>(null);
  const [isPrivateRecord, setIsPrivateRecord] = useState<boolean | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());

  // Check if record is private by querying storage
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

  useEffect(() => {
    const allRecords = [...privateRecords, ...publicRecords];
    const found = allRecords.find((r) => r.id === Number(id));
    setRecord(found || null);
    setRecordLoading(false);
  }, [id, privateRecords, publicRecords]);

  // Reload when authentication state changes to get private data
  useEffect(() => {
    if (isAuthenticated && !record && isPrivateRecord) {
      setRecordLoading(true);
      // Give the VaultContext time to reload
      setTimeout(() => {
        const allRecords = [...privateRecords, ...publicRecords];
        const found = allRecords.find((r) => r.id === Number(id));
        setRecord(found || null);
        setRecordLoading(false);
      }, 200);
    }
  }, [isAuthenticated, id, privateRecords, publicRecords, record, isPrivateRecord]);

  const toggleFieldVisibility = (field: string) => {
    setVisibleFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const handleDelete = async () => {
    if (!record) return;
    
    try {
      await deleteRecord(record.id);
      setToast({ message: 'Record deleted successfully', type: 'success' });
      setTimeout(() => navigate(`/category/${record.type}`), 1500);
    } catch {
      setToast({ message: 'Failed to delete record', type: 'error' });
    }
  };

  if (recordLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Record not found</div>
      </div>
    );
  }

  // Require authentication for private records
  const requiresAuth = record.isPrivate && !isAuthenticated;

  const renderField = (label: string, value: string, sensitive: boolean = false, fieldKey?: string) => {
    const isVisible = fieldKey ? visibleFields.has(fieldKey) : true;
    
    return (
      <div className="space-y-2 animate-fade-in">
        <label className="block text-sm font-medium text-neutral-700">{label}</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 input-field text-neutral-900 font-mono">
            {sensitive && !isVisible ? '••••••••' : value}
          </div>
          {sensitive && fieldKey && (
            <button
              onClick={() => toggleFieldVisibility(fieldKey)}
              className="p-2.5 glass-effect hover:bg-neutral-200/50 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              {isVisible ? <EyeOff size={20} className="text-neutral-600" /> : <Eye size={20} className="text-neutral-600" />}
            </button>
          )}
          <CopyButton text={value} label="Copy" />
        </div>
      </div>
    );
  };

  const pageContent = (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200">
      {/* Header */}
      <div className="glass-effect border-b border-neutral-200/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-neutral-200/50 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <ArrowLeft size={24} className="text-neutral-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 font-heading">Record Details</h1>
                <div className="flex items-center gap-2.5 mt-1">
                  <SecurityBadge isPrivate={record.isPrivate} />
                  <span className="text-sm text-neutral-600">
                    {new Date(record.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/edit/${record.id}`)}
                className="p-2.5 btn-primary shadow-md hover:shadow-lg transition-all"
                aria-label="Edit"
              >
                <Edit size={20} className="text-white" />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                aria-label="Delete"
              >
                <Trash2 size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="card space-y-6 animate-slide-up">
          {record.type === 'card' && (
            <>
              {renderField('Bank Name', record.bankName)}
              {renderField('Card Type', record.cardType.toUpperCase())}
              {renderField('Cardholder Name', record.cardholderName)}
              {renderField('Card Number', record.cardNumber, true, 'cardNumber')}
              <div className="grid grid-cols-3 gap-4">
                <div>{renderField('Expiry Date', record.expiryDate, true, 'expiry')}</div>
                <div>{renderField('CVV', record.cvv, true, 'cvv')}</div>
                <div>{renderField('PIN', record.cardPin, true, 'pin')}</div>
              </div>
            </>
          )}

          {record.type === 'netbanking' && (
            <>
              {renderField('Bank Name', record.bankName)}
              {renderField('Account Holder Name', record.accountHolderName)}
              {renderField('Login ID', record.loginId)}
              {renderField('Password', record.password, true, 'password')}
              {renderField('Website URL', record.url)}
              {record.accountNumber && renderField('Account Number', record.accountNumber, true, 'account')}
            </>
          )}

          {record.type === 'note' && (
            <>
              {renderField('Title', record.title)}
              <div className="space-y-2 animate-fade-in">
                <label className="block text-sm font-medium text-neutral-700">Content</label>
                <div className="input-field text-neutral-900 whitespace-pre-wrap min-h-[200px]">
                  {record.content}
                </div>
                <CopyButton text={record.content} label="Copy Content" />
              </div>
            </>
          )}

          {/* Tags */}
          {record.tags && record.tags.length > 0 && (
            <div className="space-y-2 pt-6 border-t border-neutral-200">
              <label className="block text-sm font-medium text-neutral-700">Tags</label>
              <div className="flex flex-wrap gap-2">
                {record.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="badge-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-6 border-t border-neutral-200 text-sm text-neutral-600 space-y-1.5">
            <p><span className="font-medium">Created:</span> {new Date(record.createdAt).toLocaleString()}</p>
            <p><span className="font-medium">Updated:</span> {new Date(record.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Record"
        message="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

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
