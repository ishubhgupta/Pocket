import {
  KDF_ITERATIONS,
  IV_LENGTH,
  SALT_LENGTH,
} from '../utils/constants';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  generateRandomBytes,
  stringToArrayBuffer,
  arrayBufferToString,
} from '../utils/crypto-helpers';

/**
 * CryptoService handles all cryptographic operations using Web Crypto API
 * - AES-GCM-256 for data encryption
 * - PBKDF2-SHA256 for PIN-to-key derivation
 * - Secure key wrapping/unwrapping
 */
class CryptoService {
  /**
   * Generate a new AES-GCM 256-bit master key
   */
  async generateMasterKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
  }

  /**
   * Derive a cryptographic key from a PIN using PBKDF2
   */
  async derivePinKey(
    pin: string,
    salt: Uint8Array,
    iterations: number = KDF_ITERATIONS
  ): Promise<CryptoKey> {
    const pinBuffer = stringToArrayBuffer(pin);
    
    const baseKey = await crypto.subtle.importKey(
      'raw',
      pinBuffer as BufferSource,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: iterations,
        hash: 'SHA-256',
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['wrapKey', 'unwrapKey']
    );
  }

  /**
   * Wrap (encrypt) the master key with the PIN-derived key
   */
  async wrapMasterKey(
    masterKey: CryptoKey,
    pinKey: CryptoKey
  ): Promise<{ ciphertext: string; iv: string }> {
    const iv = generateRandomBytes(IV_LENGTH);
    
    const wrapped = await crypto.subtle.wrapKey(
      'raw',
      masterKey,
      pinKey,
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      }
    );

    return {
      ciphertext: arrayBufferToBase64(wrapped),
      iv: arrayBufferToBase64(iv),
    };
  }

  /**
   * Unwrap (decrypt) the master key with the PIN-derived key
   */
  async unwrapMasterKey(
    wrappedKey: string,
    iv: string,
    pinKey: CryptoKey
  ): Promise<CryptoKey> {
    const wrappedBuffer = base64ToArrayBuffer(wrappedKey);
    const ivBuffer = base64ToArrayBuffer(iv);

    return await crypto.subtle.unwrapKey(
      'raw',
      wrappedBuffer,
      pinKey,
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data with the master key
   */
  async encryptData(
    data: string,
    masterKey: CryptoKey
  ): Promise<{ ciphertext: string; iv: string }> {
    const iv = generateRandomBytes(IV_LENGTH);
    const dataBuffer = stringToArrayBuffer(data);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      masterKey,
      dataBuffer as BufferSource
    );

    return {
      ciphertext: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv),
    };
  }

  /**
   * Decrypt data with the master key
   */
  async decryptData(
    ciphertext: string,
    iv: string,
    masterKey: CryptoKey
  ): Promise<string> {
    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
    const ivBuffer = base64ToArrayBuffer(iv);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      masterKey,
      ciphertextBuffer
    );

    return arrayBufferToString(decrypted);
  }

  /**
   * Generate a random salt for key derivation
   */
  generateSalt(): Uint8Array {
    return generateRandomBytes(SALT_LENGTH);
  }

  /**
   * Generate a random initialization vector
   */
  generateIV(): Uint8Array {
    return generateRandomBytes(IV_LENGTH);
  }
}

export const cryptoService = new CryptoService();
