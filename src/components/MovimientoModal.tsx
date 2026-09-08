import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { crearMovimiento } from '../lib/queries'
import type { Categoria, Moneda, TipoMovimiento } from '../lib/types'
import { supabase } from '../lib/supabaseClient'
import { IconClose } from './icons'

export default function MovimientoModal({ onClose }: { onClose: () => void }) {
  const { hogar, perfil } = useAuth()
  const { bump } = useData()

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tipo, setTipo] = useState<TipoMovimiento>('gasto')
  const [moneda, setMoneda] = useState<Moneda>('ARS')
  const [monto, setMonto] = useState('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hogar) return
    supabase
      .from('categorias')
      .select('*')
      .eq('hogar_id', hogar.id)
      .order('orden')
      .then(({ data }) => setCategorias((data ?? []) as Categoria[]))
  }, [hogar])

  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo)

  useEffect(() => {
    // si cambia el tipo, resetear la categoría elegida a la primera que corresponda
    const primera = categorias.find((c) => c.tipo === tipo)
    setCategoriaId(primera?.id ?? '')
  }, [tipo, categorias])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!hogar || !perfil) return
    const montoNum = Number(monto.replace(',', '.'))
    if (!montoNum || montoNum <= 0) {
      setError('Ingresá un monto válido')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await crearMovimiento({
        hogar_id: hogar.id,
        usuario_id: perfil.id,
        categoria_id: categoriaId || null,
        tipo,
        monto: montoNum,
        moneda,
        fecha,
        es_fijo: false,
        nota: nota.trim() || null,
      })
      bump()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el movimiento')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-t-3xl border-t border-border p-5 pb-8 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Nuevo movimiento</h2>
          <button onClick={onClose} className="text-muted p-1" aria-label="Cerrar">
            <IconClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipo('gasto')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
                tipo === 'gasto' ? 'bg-expense/15 border-expense text-expense' : 'border-border text-muted'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setTipo('ingreso')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
                tipo === 'ingreso' ? 'bg-accent/15 border-accent text-accent' : 'border-border text-muted'
              }`}
            >
              Ingreso
            </button>
          </div>

          <div>
            <label className="text-[11px] text-muted uppercase tracking-wide">Monto</label>
            <div className="flex gap-2 mt-1">
              <div className="flex rounded-xl border border-border overflow-hidden">
                {(['ARS', 'USD'] as Moneda[]).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMoneda(m)}
                    className={`px-3 text-xs font-semibold ${
                      moneda === m ? 'bg-accent text-bg' : 'text-muted'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                inputMode="decimal"
                placeholder="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="flex-1 bg-card-alt border border-border rounded-xl px-3 py-2 font-mono text-lg outline-none focus:border-border-strong"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted uppercase tracking-wide">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="mt-1 w-full bg-card-alt border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-border-strong"
            >
              {categoriasFiltradas.length === 0 && <option value="">Sin categorías</option>}
              {categoriasFiltradas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-muted uppercase tracking-wide">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1 w-full bg-card-alt border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-border-strong"
            />
          </div>

          <div>
            <label className="text-[11px] text-muted uppercase tracking-wide">Nota (opcional)</label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: cena cumpleaños"
              className="mt-1 w-full bg-card-alt border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-border-strong"
            />
          </div>

          {error && <p className="text-expense text-sm">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="mt-1 w-full py-3 rounded-xl bg-accent text-bg font-semibold disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  )
}
