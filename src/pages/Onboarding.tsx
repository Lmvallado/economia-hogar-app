import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Onboarding() {
  const { refrescar } = useAuth()
  const [modo, setModo] = useState<'crear' | 'unirse'>('crear')
  const [nombreHogar, setNombreHogar] = useState('')
  const [codigo, setCodigo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      if (modo === 'crear') {
        const { error: rpcError } = await supabase.rpc('crear_hogar', { p_nombre: nombreHogar })
        if (rpcError) throw rpcError
      } else {
        const { error: rpcError } = await supabase.rpc('unirse_a_hogar', { p_codigo: codigo })
        if (rpcError) throw rpcError
      }
      await refrescar()
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
        <h1 className="font-display text-2xl font-bold text-center mt-1 mb-2">Un paso más</h1>
        <p className="text-sm text-muted text-center mb-8">
          Creá el hogar para empezar a cargar movimientos, o unite con el código que te pasó tu pareja.
        </p>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setModo('crear')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
              modo === 'crear' ? 'bg-accent/15 border-accent text-accent' : 'border-border text-muted'
            }`}
          >
            Crear hogar
          </button>
          <button
            onClick={() => setModo('unirse')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
              modo === 'unirse' ? 'bg-accent/15 border-accent text-accent' : 'border-border text-muted'
            }`}
          >
            Unirme a uno
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {modo === 'crear' ? (
            <div>
              <label className="text-[11px] text-muted uppercase tracking-wide">Nombre del hogar</label>
              <input
                required
                value={nombreHogar}
                onChange={(e) => setNombreHogar(e.target.value)}
                placeholder="Ej: Casa Vallado"
                className="mt-1 w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-border-strong"
              />
            </div>
          ) : (
            <div>
              <label className="text-[11px] text-muted uppercase tracking-wide">Código de invitación</label>
              <input
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: 8F3K1A"
                className="mt-1 w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm tracking-widest outline-none focus:border-border-strong"
              />
            </div>
          )}

          {error && <p className="text-expense text-sm">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="mt-2 w-full py-3 rounded-xl bg-accent text-bg font-semibold disabled:opacity-60"
          >
            {cargando ? 'Un momento…' : modo === 'crear' ? 'Crear hogar' : 'Unirme'}
          </button>
        </form>
      </div>
    </div>
  )
}
