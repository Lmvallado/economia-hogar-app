import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [modo, setModo] = useState<'ingresar' | 'crear'>('ingresar')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avisoConfirmacion, setAvisoConfirmacion] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      if (modo === 'crear') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre } },
        })
        if (signUpError) throw signUpError
        setAvisoConfirmacion(true)
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-[11px] font-medium tracking-widest text-muted uppercase text-center">
          Economía Hogar
        </div>
        <h1 className="font-display text-2xl font-bold text-center mt-1 mb-8">
          {modo === 'ingresar' ? 'Bienvenido de nuevo' : 'Creá tu cuenta'}
        </h1>

        {avisoConfirmacion ? (
          <div className="bg-card border border-border rounded-2xl p-5 text-sm text-center">
            Te enviamos un email para confirmar tu cuenta. Confirmalo y volvé a esta pantalla para entrar.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {modo === 'crear' && (
              <div>
                <label className="text-[11px] text-muted uppercase tracking-wide">Tu nombre</label>
                <input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-1 w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-border-strong"
                  placeholder="Leo"
                />
              </div>
            )}
            <div>
              <label className="text-[11px] text-muted uppercase tracking-wide">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-border-strong"
                placeholder="vos@ejemplo.com"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted uppercase tracking-wide">Contraseña</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-border-strong"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-expense text-sm">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="mt-2 w-full py-3 rounded-xl bg-accent text-bg font-semibold disabled:opacity-60"
            >
              {cargando ? 'Un momento…' : modo === 'ingresar' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        )}

        {!avisoConfirmacion && (
          <button
            onClick={() => setModo(modo === 'ingresar' ? 'crear' : 'ingresar')}
            className="mt-5 w-full text-center text-sm text-muted"
          >
            {modo === 'ingresar' ? '¿No tenés cuenta? Creala' : '¿Ya tenés cuenta? Ingresá'}
          </button>
        )}
      </div>
    </div>
  )
}
