/**
 * Biometric Authentication Service
 * Handles WebAuthn/biometric authentication for vault unlock
 */

const CREDENTIAL_ID_KEY = 'pocket_biometric_credential_id';
const MASTER_KEY_ENCRYPTED_KEY = 'pocket_biometric_master_key';

export interface BiometricAvailability {
  available: boolean;
  type: 'fingerprint' | 'face' | 'platform' | 'none';
}

class BiometricService {
  /**
   * Check if biometric authentication is available on this device
   */
  async isAvailable(): Promise<BiometricAvailability> {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      console.log('[Biometric] WebAuthn not supported');
      return { available: false, type: 'none' };
    }

    try {
      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log('[Biometric] Platform authenticator available:', available);
      
      if (!available) {
        return { available: false, type: 'none' };
      }

      // Try to determine the type of biometric
      const type = this.detectBiometricType();
      console.log('[Biometric] Detected type:', type);
      
      return { available: true, type };
    } catch (error) {
      console.error('[Biometric] Error checking availability:', error);
      return { available: false, type: 'none' };
    }
  }

  /**
   * Detect the type of biometric authentication available
   */
  private detectBiometricType(): 'fingerprint' | 'face' | 'platform' {
    const ua = navigator.userAgent.toLowerCase();
    
    // iOS devices with Face ID
    if (/iphone|ipad|ipod/.test(ua)) {
      // iPhone X and later models typically have Face ID
      // Older models have Touch ID
      return 'face'; // Default to face for iOS (can be either)
    }
    
    // MacBooks with Touch ID
    if (/mac/.test(ua) && 'ontouchstart' in window) {
      return 'fingerprint';
    }
    
    // Android devices (typically fingerprint)
    if (/android/.test(ua)) {
      return 'fingerprint';
    }
    
    // Windows Hello (can be face or fingerprint)
    if (/windows/.test(ua)) {
      return 'face'; // Windows Hello includes face recognition
    }
    
    return 'platform';
  }

  /**
   * Check if biometric is currently enabled/enrolled
   */
  isEnabled(): boolean {
    const credentialId = localStorage.getItem(CREDENTIAL_ID_KEY);
    const encryptedKey = localStorage.getItem(MASTER_KEY_ENCRYPTED_KEY);
    return !!(credentialId && encryptedKey);
  }

  /**
   * Enroll biometric authentication by storing the master key
   * @param masterKey - The vault's master encryption key
   */
  async enroll(masterKey: CryptoKey): Promise<void> {
    try {
      console.log('[Biometric] Starting enrollment...');
      
      // Export the master key to store it
      const exportedKey = await window.crypto.subtle.exportKey('raw', masterKey);
      const keyArray = new Uint8Array(exportedKey);

      // Generate a random challenge
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));

      console.log('[Biometric] Creating WebAuthn credential...');
      console.log('[Biometric] Hostname:', window.location.hostname);
      
      // Create a WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Pocket Vault',
            id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
          },
          user: {
            id: window.crypto.getRandomValues(new Uint8Array(16)),
            name: 'vault-user',
            displayName: 'Vault User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false,
          },
          timeout: 60000,
          attestation: 'none',
        },
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create biometric credential');
      }

      // Store the credential ID
      const credentialId = Array.from(new Uint8Array(credential.rawId))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      localStorage.setItem(CREDENTIAL_ID_KEY, credentialId);

      // Encrypt the master key with a device-bound key (using WebCrypto)
      // For simplicity, we'll use a deterministic key derived from the credential
      const encryptionKey = await this.deriveEncryptionKey(credentialId);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedKey = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
        keyArray
      );

      // Store encrypted master key and IV
      const encryptedData = {
        encrypted: Array.from(new Uint8Array(encryptedKey)).map(b => b.toString(16).padStart(2, '0')).join(''),
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      };
      
      localStorage.setItem(MASTER_KEY_ENCRYPTED_KEY, JSON.stringify(encryptedData));
      
      console.log('[Biometric] Enrollment successful');
    } catch (error) {
      console.error('[Biometric] Enrollment failed:', error);
      // Clean up on failure
      localStorage.removeItem(CREDENTIAL_ID_KEY);
      localStorage.removeItem(MASTER_KEY_ENCRYPTED_KEY);
      throw new Error(`Failed to enroll biometric authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Authenticate using biometric and retrieve the master key
   */
  async authenticate(): Promise<CryptoKey | null> {
    try {
      console.log('[Biometric] Starting authentication...');
      
      const credentialId = localStorage.getItem(CREDENTIAL_ID_KEY);
      const encryptedKeyData = localStorage.getItem(MASTER_KEY_ENCRYPTED_KEY);

      if (!credentialId || !encryptedKeyData) {
        console.error('[Biometric] Not enrolled');
        throw new Error('Biometric not enrolled');
      }

      // Parse stored data
      const { encrypted, iv } = JSON.parse(encryptedKeyData);
      const credentialIdBytes = new Uint8Array(
        credentialId.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
      );

      // Generate a challenge
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));

      console.log('[Biometric] Requesting biometric authentication...');
      
      // Request biometric authentication
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
          allowCredentials: [
            {
              id: credentialIdBytes,
              type: 'public-key',
              transports: ['internal'],
            },
          ],
          timeout: 60000,
          userVerification: 'required',
        },
      }) as PublicKeyCredential;

      if (!assertion) {
        console.error('[Biometric] Authentication cancelled or failed');
        return null;
      }

      console.log('[Biometric] Authentication successful, decrypting master key...');

      // Derive the encryption key from credential ID
      const encryptionKey = await this.deriveEncryptionKey(credentialId);

      // Decrypt the master key
      const encryptedBytes = new Uint8Array(
        encrypted.match(/.{2}/g)!.map((byte: string) => parseInt(byte, 16))
      );
      const ivBytes = new Uint8Array(
        iv.match(/.{2}/g)!.map((byte: string) => parseInt(byte, 16))
      );

      const decryptedKey = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes },
        encryptionKey,
        encryptedBytes
      );

      // Import the master key
      const masterKey = await window.crypto.subtle.importKey(
        'raw',
        decryptedKey,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );

      console.log('[Biometric] Master key retrieved successfully');
      return masterKey;
    } catch (error) {
      console.error('[Biometric] Authentication failed:', error);
      return null;
    }
  }

  /**
   * Disable biometric authentication
   */
  async disable(): Promise<void> {
    localStorage.removeItem(CREDENTIAL_ID_KEY);
    localStorage.removeItem(MASTER_KEY_ENCRYPTED_KEY);
  }

  /**
   * Derive an encryption key from the credential ID
   */
  private async deriveEncryptionKey(credentialId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const data = encoder.encode(credentialId);
    
    // Hash the credential ID to get a consistent key
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    
    // Import as AES key
    return await window.crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }
}

export const biometricService = new BiometricService();
