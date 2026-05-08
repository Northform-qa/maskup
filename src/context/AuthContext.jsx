import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('users')
    .select('role, display_name')
    .eq('id', userId)
    .single()
  return data ?? null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!active) return
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          const p = await fetchProfile(u.id)
          if (active) setProfile(p)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const p = await fetchProfile(u.id)
        setProfile(p)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    // user/profile cleared automatically via onAuthStateChange
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
