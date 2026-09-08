import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Hogar, Perfil } from '../lib/types'

interface AuthContextValue {
  loading: boolean
  session: Session | null
  user: User | null
  perfil: Perfil | null
  hogar: Hogar | null
  refrescar: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [hogar, setHogar] = useState<Hogar | null>(null)

  async function cargarPerfilYHogar(userId: string) {
    const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', userId).maybeSingle()
    setPerfil(perfilData ?? null)

    if (perfilData?.hogar_id) {
      const { data: hogarData } = await supabase.from('hogares').select('*').eq('id', perfilData.hogar_id).maybeSingle()
      setHogar(hogarData ?? null)
    } else {
      setHogar(null)
    }
  }

  async function refrescar() {
    const {
      data: { session: s },
    } = await supabase.auth.getSession()
    setSession(s)
    if (s?.user) {
      await cargarPerfilYHogar(s.user.id)
    } else {
      setPerfil(null)
      setHogar(null)
    }
  }

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!activo) return
      setSession(s)
      if (s?.user) await cargarPerfilYHogar(s.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s?.user) {
        await cargarPerfilYHogar(s.user.id)
      } else {
        setPerfil(null)
        setHogar(null)
      }
    })

    return () => {
      activo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ loading, session, user: session?.user ?? null, perfil, hogar, refrescar, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
