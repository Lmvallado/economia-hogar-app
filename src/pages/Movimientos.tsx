import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { borrarMovimiento, fetchMovimientosDelRango } from '../lib/queries'
import { formatMonto, nombreMes, rangoDelMes } from '../lib/format'
import type { Movimiento } from '../lib/types'
import { IconTrash } from '../components/icons'

function formatFecha(fecha: string) {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d))
}

export default function Movimientos() {
  const { hogar } = useAuth()
  const { version, bump } = useData()
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [cargando, setCargando] = useState(true)

  const { desde, hasta } = useMemo(() => rangoDelMes(), [])

  useEffect(() => {
    if (!hogar) return
    setCargando(true)
    fetchMovimientosDelRango(hogar.id, desde, hasta)
      .then(setMovimientos)
      .finally(() => setCargando(false))
  }, [hogar, desde, hasta, version])

  async function handleBorrar(id: string) {
    if (!confirm('¿Borrar este movimiento?')) return
    await borrarMovimiento(id)
    bump()
  }

  const grupos = useMemo(() => {
    const mapa = new Map<string, Movimiento[]>()
    for (const m of movimientos) {
      const lista = mapa.get(m.fecha) ?? []
      lista.push(m)
      mapa.set(m.fecha, lista)
    }
    return Array.from(mapa.entries())
  }, [movimientos])

  return (
    <div className="flex flex-col gap-4">
      <div className="text-[11px] text-muted -mt-1">{nombreMes()}</div>

      {cargando ? (
        <div className="text-sm text-muted">Cargando…</div>
      ) : movimientos.length === 0 ? (
        <div className="text-sm text-muted bg-card border border-border rounded-2xl p-4">
          Todavía no cargaste movimientos este mes. Usá el botón + para agregar el primero.
        </div>
      ) : (
        grupos.map(([fecha, items]) => (
          <div key={fecha}>
            <div className="text-[11px] text-muted mb-2">{formatFecha(fecha)}</div>
            <div className="flex flex-col gap-2">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {m.categoria?.nombre ?? 'Sin categoría'}
                      {m.es_fijo && <span className="ml-1.5 text-[10px] text-muted border border-border rounded-full px-1.5 py-0.5">fijo</span>}
                    </div>
                    <div className="text-[11px] text-muted truncate">
                      {m.nota ? `${m.nota} · ` : ''}
                      {m.usuario?.nombre ?? '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`font-mono text-sm font-semibold ${m.tipo === 'ingreso' ? 'text-accent' : 'text-expense'}`}>
                      {m.tipo === 'ingreso' ? '+' : '-'}
                      {formatMonto(Number(m.monto), m.moneda)}
                    </span>
                    <button onClick={() => handleBorrar(m.id)} className="text-muted-2 p-1" aria-label="Borrar">
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
