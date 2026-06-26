import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly')

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider)
  const credential = GoogleAuthProvider.credentialFromResult(result)
  if (credential && credential.accessToken) {
    localStorage.setItem('dz_google_access_token', credential.accessToken)
  }
  return result
}

export const signOutUser = async () => {
  localStorage.removeItem('dz_google_access_token')
  await signOut(auth)
}
export const onAuthChange     = (cb) => onAuthStateChanged(auth, cb)

/**
 * Wait for Firebase to restore the auth session, then return the ID token.
 * Without the waitForUser() call, getIdToken() returns null on page load
 * because Firebase hasn't finished checking localStorage yet.
 */
function waitForUser(timeoutMs = 5000) {
  return new Promise((resolve) => {
    // If already signed in, return immediately
    if (auth.currentUser) {
      resolve(auth.currentUser)
      return
    }
    const timer = setTimeout(() => resolve(null), timeoutMs)
    const unsub = onAuthStateChanged(auth, (user) => {
      clearTimeout(timer)
      unsub()
      resolve(user)
    })
  })
}

export async function getIdToken() {
  const user = await waitForUser()
  if (!user) return null
  try {
    return await user.getIdToken()
  } catch {
    return null
  }
}