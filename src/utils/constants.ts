// Cryptographic constants
export const KDF_ITERATIONS = 300000;
export const AES_KEY_LENGTH = 256;
export const IV_LENGTH = 12;
export const SALT_LENGTH = 16;

// Security constants
export const LOCKOUT_SCHEDULE = [0, 30, 600, 3600, 21600]; // seconds: 0s, 30s, 10min, 1h, 6h
export const AUTO_LOCK_TIMEOUT = 120; // 2 minutes (120 seconds)
export const CLIPBOARD_CLEAR_TIMEOUT = 120000; // 120 seconds in milliseconds

// Database constants
export const DB_NAME = 'PocketDB';
export const DB_VERSION = 1;
export const STORE_META = 'meta';
export const STORE_RECORDS = 'records';
