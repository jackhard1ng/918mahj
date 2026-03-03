import { createContext, useContext, useState, useEffect } from 'react'
import { auth, hasConfig } from '../firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { saveUserProfile, subscribeToUserProfile } from '../services/db'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Listen to Firebase auth state
  useEffect(() => {
    if (!hasConfig || !auth) {
      setLoading(false)
      return
    }

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setProfile(null)
        setLoading(false)
      }
    })
    return unsub
  }, [])

  // Subscribe to user profile when user changes
  useEffect(() => {
    if (!user) return

    const unsub = subscribeToUserProfile(user.uid, (profileData) => {
      setProfile(profileData)
      setLoading(false)
    })
    return unsub
  }, [user?.uid])

  async function signup(email, password, name, phone) {
    if (!auth) throw new Error('Firebase not configured')
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await saveUserProfile(cred.user.uid, {
      name,
      email,
      phone: phone || '',
      level: 'beginner',
      hasPunchCard: false,
      punchCardPunches: 0,
      newsletter: false,
      createdAt: Date.now(),
    })
    return cred.user
  }

  async function login(email, password) {
    if (!auth) throw new Error('Firebase not configured')
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }

  async function logout() {
    if (!auth) return
    await signOut(auth)
    setProfile(null)
  }

  async function updateUserProfile(data) {
    if (!user) return false
    return await saveUserProfile(user.uid, data)
  }

  const value = {
    user,
    profile,
    loading,
    signup,
    login,
    logout,
    updateUserProfile,
    isLoggedIn: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
