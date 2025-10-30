# Unified Robust Sync Architecture

## Overview
The sync system has been completely rewritten to provide a unified, robust, and conflict-free synchronization mechanism across devices without data corruption.

## Key Features

### 1. **Bidirectional Sync**
- Uploads new/modified local records to cloud
- Downloads new/modified cloud records to local
- Intelligently merges changes based on timestamps

### 2. **Deletion Propagation** ✅ NEW
- **Soft Delete Pattern**: Records are marked as `deleted: true` instead of being permanently removed
- Deletions sync across all devices in real-time
- Automatic cleanup of old deleted records after 24 hours
- No more zombie records appearing after deletion

### 3. **Real-Time Sync** ✅ NEW
- Automatic sync when cloud changes are detected
- Uses Firestore's `onSnapshot()` listener
- Debounced to prevent excessive syncs (1 second delay)
- Only syncs when changes come from other devices
- No manual "Sync Now" needed for most cases

### 4. **Conflict Resolution**
- **Last-Write-Wins**: Most recent timestamp takes precedence
- Device tracking prevents sync loops
- Data integrity validation before upload
- Conflict counter in sync results

### 5. **Data Integrity**
- Validates record structure before upload
- Atomic operations (all-or-nothing)
- Error tracking per record
- Comprehensive error reporting

## Architecture

### Cloud Record Structure
```typescript
interface CloudRecord {
  // Standard fields
  id: number;
  type: 'card' | 'netbanking' | 'note' | 'password';
  data: string; // Encrypted
  createdAt: number;
  updatedAt: number;
  
  // Cloud sync fields
  cloudUpdatedAt: number; // Timestamp when uploaded to cloud
  deviceId: string;       // Which device uploaded this
  deleted?: boolean;      // Soft delete flag
  serverTimestamp: any;   // Firebase server timestamp
}
```

### Sync Result
```typescript
interface SyncResult {
  uploaded: number;    // Records uploaded to cloud
  downloaded: number;  // Records downloaded from cloud
  deleted: number;     // Records deleted during sync
  conflicts: number;   // Conflicts detected (future use)
  errors: string[];    // Any errors encountered
}
```

## Sync Flow

### Manual Sync (Sync Now)
1. Get sync metadata (last sync time)
2. Load all local records
3. Download all cloud records
4. Build comparison maps
5. For each local record:
   - If not in cloud → Upload
   - If in cloud and deleted → Delete local
   - If in cloud and local is newer → Upload
   - If in cloud and cloud is newer → Download
6. For each cloud-only record:
   - If not deleted → Download
7. Update sync metadata
8. Dispatch sync-complete event

### Real-Time Sync
1. Firestore listener detects changes
2. Check if changes are from another device
3. Debounce for 1 second
4. Trigger full bidirectional sync
5. UI automatically updates

### Deletion Flow
1. User deletes record locally
2. Local IndexedDB record removed
3. Cloud record marked with `deleted: true`
4. Real-time listener on other devices detects change
5. Other devices sync and remove local record
6. After 24 hours, cleanup removes cloud marker

## API

### FirebaseSyncService

#### `syncToCloud(): Promise<SyncResult>`
Main sync function. Performs bidirectional sync with conflict resolution.

#### `deleteRecord(recordId: number): Promise<void>`
Marks a record as deleted in the cloud (soft delete).

#### `enableRealtimeSync(callback: () => void): void`
Enables real-time sync listener. Callback is called when external changes detected.

#### `disableRealtimeSync(): void`
Disables real-time sync listener (e.g., when user signs out).

#### `resetSyncMetadata(): Promise<void>`
Resets sync metadata to force a fresh sync (troubleshooting).

#### `cleanupDeletedRecords(): Promise<number>`
Removes deleted records older than 24 hours from cloud.

#### `canSync(): boolean`
Returns true if user is signed in and sync is available.

#### `isSyncInProgress(): boolean`
Returns true if a sync operation is currently running.

## Usage

### In VaultContext (Automatic)
```typescript
// Deletion now automatically syncs
await storageService.deleteRecord(recordId);
await firebaseSyncService.deleteRecord(recordId); // Marks as deleted in cloud
```

### In SyncContext (Automatic)
```typescript
// Real-time sync enabled on sign-in
useEffect(() => {
  if (user) {
    firebaseSyncService.enableRealtimeSync(() => {
      // Real-time update detected, sync will happen automatically
    });
  }
  return () => firebaseSyncService.disableRealtimeSync();
}, [user]);
```

### Manual Sync (User-Triggered)
```typescript
const { syncNow } = useSyncContext();
await syncNow(); // Manually trigger sync
```

### Reset Sync (Troubleshooting)
```typescript
const { resetAndSync } = useSyncContext();
await resetAndSync(); // Force fresh sync
```

## UI Updates

### Sync Statistics Display
- **Uploaded**: Blue gradient card
- **Downloaded**: Green gradient card
- **Deleted**: Red gradient card (shows if > 0)
- **Conflicts**: Yellow gradient card (shows if > 0)
- **Errors**: Red alert box with details

### Real-Time Indicator
- Sync happens automatically in background
- No "Sync Now" needed for most operations
- Last sync time displayed
- Sync status shows "Syncing..." during operation

## Benefits

### ✅ No Data Corruption
- Atomic operations ensure all-or-nothing updates
- Validation before upload prevents malformed data
- Soft deletes prevent accidental permanent data loss

### ✅ True Cross-Device Sync
- Changes appear on all devices within 1-2 seconds
- Deletions propagate instantly
- No manual intervention needed

### ✅ Conflict-Free
- Last-write-wins prevents conflicts
- Device tracking prevents sync loops
- Timestamp-based resolution is deterministic

### ✅ Reliable
- Comprehensive error handling
- Error tracking per record
- Sync can continue even if one record fails

### ✅ Efficient
- Only syncs changed records
- Debounced real-time updates
- Cleanup removes old deleted records

## Testing Scenarios

### Test 1: Add Record on Device A
1. Device A adds new note
2. Note saved locally and uploaded to cloud
3. Device B's real-time listener detects change
4. Device B automatically syncs and downloads note
5. Note appears on Device B within 1-2 seconds

### Test 2: Delete Record on Device A
1. Device A deletes note
2. Note removed from local storage
3. Cloud record marked as `deleted: true`
4. Device B's listener detects change
5. Device B syncs and removes local note
6. Note disappears from Device B

### Test 3: Modify Record on Device A
1. Device A modifies note content
2. Local record updated with new timestamp
3. Cloud record updated
4. Device B's listener detects change
5. Device B downloads updated content
6. Updated content appears on Device B

### Test 4: Offline Editing
1. Device A goes offline
2. User edits multiple records
3. Device A comes back online
4. Manual sync uploads all changes
5. Device B receives all updates

## Troubleshooting

### Records Not Syncing?
1. Check if user is signed in
2. Check console for sync errors
3. Try "Reset & Sync" button
4. Verify Firebase rules allow access

### Deletions Not Working?
1. Check if deleteRecord() is called
2. Verify soft delete marker in Firestore
3. Check real-time listener is active
4. Check device connectivity

### Real-Time Not Working?
1. Verify real-time listener is enabled
2. Check console for listener errors
3. Verify Firebase connection
4. Try manual sync

## Future Enhancements

- [ ] Offline sync queue
- [ ] Exponential backoff for retries
- [ ] Batch operations for efficiency
- [ ] Sync conflict UI for manual resolution
- [ ] Sync history/audit log
- [ ] Compression for large datasets
- [ ] Selective sync (by record type)

## Technical Notes

### Device ID
- Unique identifier stored in `localStorage`
- Format: `device_${timestamp}_${random}`
- Used to prevent sync loops

### Sync Metadata
- Stored in Firestore: `/users/{userId}/meta/sync`
- Contains: `lastSyncTime`, `deviceId`, `serverTimestamp`
- Used for incremental syncs

### Timestamps
- `createdAt`: When record was created locally
- `updatedAt`: When record was last modified locally
- `cloudUpdatedAt`: When record was last uploaded to cloud
- All timestamps are Unix milliseconds

### Encryption
- Client-side encryption before upload
- Zero-knowledge architecture maintained
- Firebase only sees encrypted blobs
- Decryption happens on download
