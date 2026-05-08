import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, TwitterAuthProvider, UserCredential } from 'firebase/auth';
import { auth } from './firebase';
import { apiService } from './api';

export const handleFirebaseAuth = async (providerType: 'google' | 'github' | 'facebook' | 'twitter'): Promise<{ success: boolean; data: any }> => {
  let provider;

  switch (providerType) {
    case 'google':
      provider = new GoogleAuthProvider();
      break;
    case 'github':
      provider = new GithubAuthProvider();
      break;
    case 'facebook':
      provider = new FacebookAuthProvider();
      break;
    case 'twitter':
      provider = new TwitterAuthProvider();
      break;
    default:
      throw new Error('Unsupported provider');
  }

  try {
    const result: UserCredential = await signInWithPopup(auth, provider);
    const user = result.user;

    // Get Firebase ID token
    const firebaseToken = await user.getIdToken();

    // Prepare user data for backend
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      provider: providerType,
    };

    // Send to backend for authentication/registration
    const response = await apiService.firebaseAuth(firebaseToken, providerType, userData);

    console.log(`${providerType} auth successful:`, user);
    return response;
  } catch (error) {
    console.error(`${providerType} auth error:`, error);
    throw error;
  }
};
