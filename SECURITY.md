# Security Guide

## Overview

Pocket is designed with security and privacy as top priorities. This document explains the security measures implemented and best practices for using the application.

## Encryption Details

### Key Derivation
- **Algorithm**: PBKDF2 (Password-Based Key Derivation Function 2)
- **Hash Function**: SHA-256
- **Iterations**: 300,000 (OWASP recommended minimum)
- **Salt**: Randomly generated 16-byte salt per user
- **Output**: 256-bit encryption key

### Data Encryption
- **Algorithm**: AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Key Length**: 256 bits
- **IV (Initialization Vector)**: Randomly generated 12 bytes per record
- **Authentication**: Built-in authentication tag for data integrity

### What's Encrypted
- ✅ All private record data (card numbers, passwords, etc.)
- ✅ Private record titles and categories
- ✅ Metadata for private records

### What's NOT Encrypted
- ❌ Non-private record titles (for search functionality)
- ❌ Record types and categories (for organization)
- ❌ Settings and preferences

## Security Features

### 1. PIN Protection
- 4-6 digit PIN required to access private data
- PBKDF2 key derivation prevents brute force attacks
- PIN is never stored directly

### 2. Lockout Policy
- Failed login attempts trigger exponential backoff:
  - 3 failures: 30 seconds lockout
  - 4 failures: 1 minute lockout
  - 5+ failures: 5 minutes lockout
- Prevents brute force PIN guessing

### 3. Auto-Lock
- Configurable inactivity timeout (1-60 minutes)
- Automatic session expiration
- Re-authentication required after lock

### 4. Clipboard Security
- Automatic clipboard clearing after 2 minutes
- Prevents accidental data leakage
- Visual indicator when data is copied

### 5. Local-Only Storage
- All data stored in browser IndexedDB
- No network requests (except for static assets)
- No external services or APIs
- No cloud synchronization

## Best Practices

### For Users

1. **Choose a Strong PIN**
   - Use 6 digits instead of 4
   - Avoid obvious patterns (123456, 111111, etc.)
   - Don't use birthdays or other guessable numbers

2. **Regular Backups**
   - Export encrypted backups regularly
   - Store backups in a secure location
   - Test backup restoration periodically

3. **Browser Security**
   - Use a password-protected device
   - Enable browser password protection
   - Keep your browser updated
   - Use reputable browsers (Chrome, Firefox, Edge, Safari)

4. **Device Security**
   - Lock your device when not in use
   - Use full disk encryption
   - Keep your OS updated
   - Use antivirus software

5. **Clear Browsing Data Carefully**
   - Clearing browser data will delete all your Pocket data
   - Always export a backup before clearing data
   - Be careful with "Clear all data" browser features

### For Developers/Self-Hosters

1. **Use HTTPS Only**
   - Never serve the app over HTTP
   - Use valid SSL certificates
   - Enable HSTS (HTTP Strict Transport Security)

2. **Content Security Policy**
   - Restrict inline scripts
   - Whitelist only necessary domains
   - Prevent XSS attacks

3. **No Backend Modifications**
   - Keep the app purely client-side
   - Don't add server-side processing
   - Avoid adding analytics that send user data

4. **Code Auditing**
   - Review all dependencies for vulnerabilities
   - Run `npm audit` regularly
   - Keep dependencies updated

5. **Build Verification**
   - Verify the build process doesn't inject code
   - Check for unexpected network requests
   - Test in a clean environment

## Data Storage

### Browser Storage (IndexedDB)
- **Location**: Stored in browser's profile directory
- **Persistence**: Data persists until manually deleted
- **Encryption**: Private data is encrypted at rest
- **Access**: Only accessible by the same origin

### Storage Limitations
- **Quota**: Varies by browser (typically 10-50% of free disk space)
- **Eviction**: Data can be evicted if storage is full (backup regularly!)
- **Browser Profiles**: Different browser profiles = different data stores

## Threat Model

### What Pocket Protects Against

✅ **Data at Rest**: Encrypted storage protects against device theft  
✅ **Unauthorized Access**: PIN protection prevents casual snooping  
✅ **Brute Force**: Lockout policy prevents PIN guessing  
✅ **Network Sniffing**: No sensitive data sent over network  
✅ **Server Breaches**: No server = no server compromise  

### What Pocket Does NOT Protect Against

❌ **Malware/Keyloggers**: If your device is compromised, your data can be stolen  
❌ **Browser Exploits**: Vulnerabilities in the browser itself  
❌ **Physical Access**: Someone with your device and PIN can access data  
❌ **Memory Dumps**: Decrypted data in RAM could be extracted  
❌ **Screen Recording**: Screen capture software can capture displayed data  

## Vulnerability Reporting

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email the maintainer directly with details
3. Allow reasonable time for a fix before disclosure
4. Provide steps to reproduce if possible

## Security Checklist

Before deploying or using Pocket:

- [ ] Application is served over HTTPS
- [ ] Browser is up to date
- [ ] Device has password/PIN protection
- [ ] Backups are stored securely
- [ ] Auto-lock is enabled
- [ ] Strong PIN is set (6 digits minimum)
- [ ] Regular security updates are applied
- [ ] No analytics or tracking added
- [ ] No server-side processing added

## Compliance

### GDPR (General Data Protection Regulation)
- ✅ Data minimization: Only stores what's necessary
- ✅ Privacy by design: Local-only storage
- ✅ Right to erasure: Users can delete all data
- ✅ Data portability: Export/import functionality
- ✅ No data controllers: No third-party data sharing

### CCPA (California Consumer Privacy Act)
- ✅ No personal data collection
- ✅ No personal data selling
- ✅ Full user control over data

## Updates and Maintenance

- Check for updates regularly
- Review release notes for security patches
- Test updates in a non-production environment first
- Keep backups before updating

## Resources

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [PBKDF2 Recommendations](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [AES-GCM Best Practices](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)

---

**Remember**: The most secure system is only as secure as its weakest link. Follow best practices for device and browser security alongside using Pocket.
