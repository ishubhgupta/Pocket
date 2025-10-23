import { storageService } from './storage.service';
import { cryptoService } from './crypto.service';
import { StoredRecord, MetaConfig, DataType } from '../types';

interface ExportData {
  version: string;
  exportDate: string;
  appVersion: string;
  meta: MetaConfig | null;
  records: StoredRecord[];
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Export/Import Service for data portability
 * Ensures backward/forward compatibility across app versions
 */
class DataPortabilityService {
  private readonly CURRENT_VERSION = '1.0.0';
  private readonly CURRENT_APP_VERSION = '1.0.0';

  /**
   * Export all data to JSON file
   */
  async exportData(): Promise<void> {
    try {
      // Get meta configuration
      const meta = await storageService.getMeta();
      
      // Get all records (encrypted and plaintext)
      const records = await storageService.getAllRecords();

      const exportData: ExportData = {
        version: this.CURRENT_VERSION,
        exportDate: new Date().toISOString(),
        appVersion: this.CURRENT_APP_VERSION,
        meta,
        records,
      };

      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pocket-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Import data from JSON file
   */
  async importData(file: File): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    try {
      const text = await file.text();
      const importData: ExportData = JSON.parse(text);

      // Validate import data structure
      if (!this.validateImportData(importData)) {
        throw new Error('Invalid import file format');
      }

      // Check version compatibility
      if (!this.isCompatibleVersion(importData.version)) {
        result.errors.push(`Incompatible version: ${importData.version}`);
        return result;
      }

      // Import meta (if exists and not already set up)
      if (importData.meta) {
        const existingMeta = await storageService.getMeta();
        if (!existingMeta) {
          await storageService.saveMeta(importData.meta);
        }
      }

      // Import records
      for (const record of importData.records) {
        try {
          // Migrate old record types if needed
          const migratedRecord = this.migrateRecord(record);
          
          // Check if record already exists
          const existing = await storageService.getRecord(migratedRecord.id);
          if (existing) {
            result.skipped++;
            continue;
          }

          // Save record
          await storageService.saveRecord(migratedRecord);
          result.imported++;
        } catch (error) {
          result.errors.push(`Failed to import record ${record.id}: ${error}`);
        }
      }

      result.success = true;
      return result;
    } catch (error) {
      result.errors.push(`Import failed: ${error}`);
      return result;
    }
  }

  /**
   * Validate import data structure
   */
  private validateImportData(data: any): data is ExportData {
    return (
      typeof data === 'object' &&
      typeof data.version === 'string' &&
      typeof data.exportDate === 'string' &&
      Array.isArray(data.records)
    );
  }

  /**
   * Check if import version is compatible
   */
  private isCompatibleVersion(version: string): boolean {
    // Currently support all 1.x.x versions
    const [major] = version.split('.');
    const [currentMajor] = this.CURRENT_VERSION.split('.');
    return major === currentMajor;
  }

  /**
   * Migrate old record formats to current format
   * This ensures backward compatibility when data structure changes
   */
  private migrateRecord(record: StoredRecord): StoredRecord {
    const migratedRecord = { ...record };

    // Migration 1: Convert old 'account' type to 'note'
    // Accounts category has been removed, convert to notes with special tags
    if (record.type === 'account' as any) {
      migratedRecord.type = 'note' as DataType;
      
      // Add migration tag to identify converted records
      if (!migratedRecord.tags) {
        migratedRecord.tags = [];
      }
      if (!migratedRecord.tags.includes('migrated-from-account')) {
        migratedRecord.tags.push('migrated-from-account');
      }

      // If plaintext, try to convert account data to note format
      if (migratedRecord.plaintext) {
        try {
          const oldData = JSON.parse(migratedRecord.plaintext);
          const newData = {
            type: 'note',
            title: oldData.description || 'Migrated Account',
            content: `Account Type: ${oldData.accountType || 'N/A'}\nIdentifier: ${oldData.identifier || 'N/A'}\n\nAdditional Info:\n${oldData.additionalInfo || 'None'}`,
            isPrivate: oldData.isPrivate,
            tags: [...(oldData.tags || []), 'migrated-from-account'],
          };
          migratedRecord.plaintext = JSON.stringify(newData);
        } catch (e) {
          console.error('Failed to migrate account data:', e);
        }
      }
    }

    // Future migrations can be added here
    // Example:
    // if (record.version < 2) {
    //   // Apply migration for version 2
    // }

    return migratedRecord;
  }

  /**
   * Export data as encrypted backup with master key
   */
  async exportEncryptedBackup(masterKey: CryptoKey): Promise<void> {
    try {
      const meta = await storageService.getMeta();
      const records = await storageService.getAllRecords();

      const backupData = {
        version: this.CURRENT_VERSION,
        exportDate: new Date().toISOString(),
        appVersion: this.CURRENT_APP_VERSION,
        meta,
        records,
      };

      // Encrypt the entire backup
      const { ciphertext, iv } = await cryptoService.encryptData(
        JSON.stringify(backupData),
        masterKey
      );

      const encryptedBackup = {
        encrypted: true,
        version: this.CURRENT_VERSION,
        ciphertext,
        iv,
      };

      // Create download
      const blob = new Blob([JSON.stringify(encryptedBackup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pocket-encrypted-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Encrypted export failed:', error);
      throw new Error('Failed to create encrypted backup');
    }
  }

  /**
   * Import encrypted backup
   */
  async importEncryptedBackup(file: File, masterKey: CryptoKey): Promise<ImportResult> {
    try {
      const text = await file.text();
      const encryptedBackup = JSON.parse(text);

      if (!encryptedBackup.encrypted || !encryptedBackup.ciphertext || !encryptedBackup.iv) {
        throw new Error('Not an encrypted backup file');
      }

      // Decrypt backup
      const decrypted = await cryptoService.decryptData(
        encryptedBackup.ciphertext,
        encryptedBackup.iv,
        masterKey
      );

      const backupData: ExportData = JSON.parse(decrypted);

      // Import as regular backup
      return await this.importDataFromObject(backupData);
    } catch (error) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [`Failed to import encrypted backup: ${error}`],
      };
    }
  }

  /**
   * Import data from parsed object (used internally)
   */
  private async importDataFromObject(importData: ExportData): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    try {
      if (!this.validateImportData(importData)) {
        throw new Error('Invalid import data format');
      }

      if (!this.isCompatibleVersion(importData.version)) {
        result.errors.push(`Incompatible version: ${importData.version}`);
        return result;
      }

      // Import records
      for (const record of importData.records) {
        try {
          const migratedRecord = this.migrateRecord(record);
          const existing = await storageService.getRecord(migratedRecord.id);
          
          if (existing) {
            result.skipped++;
            continue;
          }

          await storageService.saveRecord(migratedRecord);
          result.imported++;
        } catch (error) {
          result.errors.push(`Failed to import record ${record.id}: ${error}`);
        }
      }

      result.success = true;
      return result;
    } catch (error) {
      result.errors.push(`Import failed: ${error}`);
      return result;
    }
  }
}

export const dataPortabilityService = new DataPortabilityService();
