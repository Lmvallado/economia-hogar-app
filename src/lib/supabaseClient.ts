import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // No detiene el build: solo avisa en consola del navegador.
  // Completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env (ver .env.example).
  console.warn(
    '[economia-hogar] Faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. La app no va a poder conectarse a la base de datos.',
  )
}

export const supabase = createClient(url ?? 'https://placeholder.supabase.co', anonKey ?? 'placeholder-anon-key')
