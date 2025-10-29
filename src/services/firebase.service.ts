import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.config';

/**
 * Firebase Authentication Service
 * Handles Google Sign-In and user session management
 */
class FirebaseAuthService {
  private currentUser: User | null = null;

  constructor() {
    // Set persistence to LOCAL (survives browser restarts)
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Failed to set auth persistence:', error);
    });

    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
    });
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      this.currentUser = result.user;
      return result.user;
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out failed:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.currentUser || auth.currentUser;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user ? user.uid : null;
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get user email
   */
  getUserEmail(): string | null {
    const user = this.getCurrentUser();
    return user ? user.email : null;
  }

  /**
   * Get user display name
   */
  getUserName(): string | null {
    const user = this.getCurrentUser();
    return user ? user.displayName : null;
  }

  /**
   * Get user photo URL
   */
  getUserPhotoURL(): string | null {
    const user = this.getCurrentUser();
    return user ? user.photoURL : null;
  }
}

export const firebaseAuthService = new FirebaseAuthService();
