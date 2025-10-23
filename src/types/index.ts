export type DataType = 'card' | 'netbanking' | 'note';

export interface BaseRecord {
  id: number;
  type: DataType;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface CardData extends BaseRecord {
  type: 'card';
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardPin: string;
  cardholderName: string;
  bankName: string;
  cardType: 'debit' | 'credit' | 'atm';
}

export interface NetbankingData extends BaseRecord {
  type: 'netbanking';
  bankName: string;
  accountHolderName: string;
  loginId: string;
  password: string;
  url: string;
  accountNumber?: string;
}

// AccountData removed - accounts category deprecated
// Kept for backward compatibility during data migration
// export interface AccountData extends BaseRecord {
//   type: 'account';
//   accountType: 'upi' | 'pan' | 'aadhaar' | 'other';
//   identifier: string;
//   description: string;
//   additionalInfo?: string;
// }

export interface NoteData extends BaseRecord {
  type: 'note';
  title: string;
  content: string;
}

export type RecordData = CardData | NetbankingData | NoteData;

export interface StoredRecord {
  id: number;
  type: DataType;
  isPrivate: boolean;
  ciphertext?: string;
  iv?: string;
  plaintext?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface MetaConfig {
  k: 'config';
  encryptedMasterKey: string;
  masterIv: string;
  kdfSalt: string;
  kdfIterations: number;
  failedAttempts: string;
  lastFailedTimestamp?: string;
  lockUntil?: string;
  lastBackup?: string;
  autoLockTimeout: number;
}

export interface ExportFile {
  version: number;
  timestamp: string;
  kdf: {
    algo: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number;
    salt: string;
  };
  wrappedMaster: {
    ciphertext: string;
    iv: string;
  };
  records: ExportRecord[];
}

export interface ExportRecord {
  ciphertext?: string;
  iv?: string;
  plaintext?: string;
  type: DataType;
  isPrivate: boolean;
  createdAt: string;
  tags: string[];
}
