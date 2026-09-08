import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { fetchMovimientosDelRango } from '../lib/queries'
import { formatMonto, nombreMes, rangoDelMes } from '../lib/format'
import type { Moneda, Movimiento } from '../lib/types'

export default function Dashboard() {
  const { hogar } = useAuth()
  const { version } = useData()
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [moneda, setMoneda] = useState<Moneda>('ARS')
  const [cargando, setCargando] = useState(true)

  const { desde, hasta } = useMemo(() => rangoDelMes(), [])

  useEffect(() => {
    if (!hogar) return
    setCargando(true)
    fetchMovimientosDelRango(hogar.id, desde, hasta)
      .then(setMovimientos)
      .finally(() => setCargando(false))
  }, [hogar, desde, hasta, version])

  const delMes = movimientos.filter((m) => m.moneda === moneda)
  const ingresos = delMes.filter((m) => m.tipo === 'ingreso').reduce((acc, m) => acc + Number(m.monto), 0)
  const gastos = delMes.filter((m) => m.tipo === 'gasto').reduce((acc, m) => acc + Number(m.monto), 0)
  const balance = ingresos - gastos

  const porCategoria = useMemo(() => {
    const mapa = new Map<string, { nombre: string; total: number }>()
    for (const m of delMes) {
      if (m.tipo !== 'gasto') continue
      const key = m.categoria?.nombre ?? 'Sin categoría'
      const actual = mapa.get(key)?.total ?? 0
      mapa.set(key, { nombre: key, total: actual + Number(m.monto) })
    }
    const lista = Array.from(mapa.values()).sort((a, b) => b.total - a.total)
    const max = lista[0]?.total ?? 1
    return lista.slice(0, 5).map((c, i) => ({ ...c, ancho: Math.max(8, Math.round((c.total / max) * 100)), destacada: i === 0 }))
  }, [delMes])

  return (
    <div className="flex flex-col gap-5">
      <div className="text-[11px] text-muted -mt-1">{nombreMes()}</div>

      <div className="bg-card border border-border rounded-[20px] p-5">
        <div className="flex gap-2 mb-4">
          {(['ARS', 'USD'] as Moneda[]).map((m) => (
            <button
              key={m}
              onClick={() => setMoneda(m)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                moneda === m ? 'bg-accent text-bg' : 'text-muted border border-border'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="font-mono text-[32px] font-semibold tracking-tight leading-none">
          {formatMonto(balance, moneda)}
        </div>
        <div className="text-xs text-muted mt-2">Balance del mes</div>

        <div className="flex mt-4 pt-3.5 border-t border-border">
          <div className="flex-1">
            <div className="text-[11px] text-muted mb-0.5">Ingresos</div>
            <div className="font-mono text-sm font-semibold text-accent">+{formatMonto(ingresos, moneda)}</div>
          </div>
          <div className="w-px bg-border mx-3.5" />
          <div className="flex-1">
            <div className="text-[11px] text-muted mb-0.5">Gastos</div>
            <div className="font-mono text-sm font-semibold text-expense">-{formatMonto(gastos, moneda)}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold tracking-wide text-muted uppercase mb-2">Gastos por categoría</div>
        {cargando ? (
          <div className="text-sm text-muted">Cargando…</div>
        ) : porCategoria.length === 0 ? (
          <div className="text-sm text-muted bg-card border border-border rounded-2xl p-4">
            Todavía no cargaste gastos en {moneda} este mes.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {porCategoria.map((c) => (
              <div key={c.nombre}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{c.nombre}</span>
                  <span className="font-mono text-muted">{formatMonto(c.total, moneda)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.destacada ? 'bg-accent' : 'bg-white/15'}`}
                    style={{ width: `${c.ancho}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
