import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  archivarTarjeta,
  borrarCompraTarjeta,
  crearCompraTarjeta,
  crearTarjeta,
  fetchComprasTarjeta,
  fetchTarjetas,
} from '../lib/queries'
import { formatMonto } from '../lib/format'
import { nombreMesCorto, primerDiaDelMes, proyectarMeses, toISOFecha } from '../lib/cuotas'
import type { CompraTarjeta, Moneda, Tarjeta } from '../lib/types'
import { IconTrash } from '../components/icons'

export default function Tarjetas() {
  const { hogar, perfil } = useAuth()
  const { version, bump } = useData()
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([])
  const [compras, setCompras] = useState<CompraTarjeta[]>([])
  const [cargando, setCargando] = useState(true)

  const [nombreTarjeta, setNombreTarjeta] = useState('')
  const [creandoTarjeta, setCreandoTarjeta] = useState(false)

  const [tarjetaId, setTarjetaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [montoTotal, setMontoTotal] = useState('')
  const [cuotasTotales, setCuotasTotales] = useState('1')
  const [moneda, setMoneda] = useState<Moneda>('ARS')
  const [guardandoCompra, setGuardandoCompra] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hogar) return
    setCargando(true)
    Promise.all([fetchTarjetas(hogar.id), fetchComprasTarjeta(hogar.id)])
      .then(([t, c]) => {
        setTarjetas(t)
        setCompras(c)
        const primera = t.find((x) => x.activa)
        if (primera) setTarjetaId((prev) => prev || primera.id)
      })
      .finally(() => setCargando(false))
  }, [hogar, version])

  const tarjetasActivas = tarjetas.filter((t) => t.activa)

  const proyeccion = useMemo(() => proyectarMeses(compras, 6), [compras])
  const comprasActivas = useMemo(
    () => compras.filter((c) => proyeccion.some((m) => m.items.some((i) => i.compra.id === c.id))),
    [compras, proyeccion],
  )

  async function handleAgregarTarjeta(e: FormEvent) {
    e.preventDefault()
    if (!hogar || !nombreTarjeta.trim()) return
    setCreandoTarjeta(true)
    try {
      await crearTarjeta({ hogar_id: hogar.id, nombre: nombreTarjeta.trim() })
      setNombreTarjeta('')
      bump()
    } finally {
      setCreandoTarjeta(false)
    }
  }

  async function handlePausarTarjeta(t: Tarjeta) {
    await archivarTarjeta(t.id, !t.activa)
    bump()
  }

  async function handleAgregarCompra(e: FormEvent) {
    e.preventDefault()
    if (!hogar || !perfil || !tarjetaId) return
    const total = Number(montoTotal.replace(',', '.'))
    const cuotas = Math.max(1, Math.round(Number(cuotasTotales)))
    if (!total || total <= 0) {
      setError('Ingresá un monto válido')
      return
    }
    setGuardandoCompra(true)
    setError(null)
    try {
      const montoCuota = Math.round((total / cuotas) * 100) / 100
      await crearCompraTarjeta({
        hogar_id: hogar.id,
        tarjeta_id: tarjetaId,
        usuario_id: perfil.id,
        descripcion: descripcion.trim() || 'Compra',
        moneda,
        monto_cuota: montoCuota,
        cuotas_totales: cuotas,
        primer_mes: toISOFecha(primerDiaDelMes()),
      })
      setDescripcion('')
      setMontoTotal('')
      setCuotasTotales('1')
      bump()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la compra')
    } finally {
      setGuardandoCompra(false)
    }
  }

  async function handleBorrarCompra(id: string) {
    if (!confirm('¿Borrar esta compra en cuotas?')) return
    await borrarCompraTarjeta(id)
    bump()
  }

  if (cargando) {
    return <div className="text-sm text-muted">Cargando…</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold tracking-wide text-muted uppercase mb-2">Próximos meses</div>
        <div className="flex flex-col gap-2">
          {proyeccion.map((m, i) => {
            const sinNada = m.totales.ARS === 0 && m.totales.USD === 0
            return (
              <div
                key={i}
                className={`flex items-center justify-between bg-card border rounded-2xl px-4 py-3 ${
                  i === 0 ? 'border-accent/40' : 'border-border'
                }`}
              >
                <div className="text-sm font-medium">{nombreMesCorto(m.mes)}</div>
                {sinNada ? (
                  <div className="text-xs text-muted">—</div>
                ) : (
                  <div className="flex gap-3 font-mono text-sm font-semibold">
                    {m.totales.ARS > 0 && <span>{formatMonto(m.totales.ARS, 'ARS')}</span>}
                    {m.totales.USD > 0 && <span>{formatMonto(m.totales.USD, 'USD')}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold tracking-wide text-muted uppercase mb-2">Tus tarjetas</div>
        {tarjetas.length === 0 ? (
          <div className="text-sm text-muted bg-card border border-border rounded-2xl p-4">
            Todavía no cargaste ninguna tarjeta.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tarjetas.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3"
              >
                <div className={`text-sm font-medium ${t.activa ? '' : 'text-muted line-through'}`}>{t.nombre}</div>
                <button
                  onClick={() => handlePausarTarjeta(t)}
                  className={`text-[10px] px-2 py-1 rounded-full border ${
                    t.activa ? 'border-accent text-accent' : 'border-border text-muted'
                  }`}
                >
                  {t.activa ? 'Activa' : 'Pausada'}
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleAgregarTarjeta} className="flex gap-2 mt-3">
          <input
            value={nombreTarjeta}
            onChange={(e) => setNombreTarjeta(e.target.value)}
            placeholder="Ej: Visa Santander"
            className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-border-strong"
          />
          <button
            type="submit"
            disabled={creandoTarjeta || !nombreTarjeta.trim()}
            className="px-4 rounded-xl bg-white/10 text-sm font-semibold disabled:opacity-60"
          >
            Agregar
          </button>
        </form>
      </div>

      <div>
        <div className="text-xs font-semibold tracking-wide text-muted uppercase mb-2">Compras en cuotas</div>
        {comprasActivas.length === 0 ? (
          <div className="text-sm text-muted bg-card border border-border rounded-2xl p-4 mb-3">
            No hay compras en cuotas pendientes.
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            {comprasActivas.map((c) => {
              const cuotaActual = proyeccion[0]?.items.find((i) => i.compra.id === c.id)?.numeroCuota
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.descripcion}</div>
                    <div className="text-[11px] text-muted truncate">
                      {c.tarjeta?.nombre ?? 'Tarjeta'} · cuota {cuotaActual ?? '—'}/{c.cuotas_totales}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-semibold">{formatMonto(Number(c.monto_cuota), c.moneda)}</span>
                    <button onClick={() => handleBorrarCompra(c.id)} className="text-muted-2 p-1" aria-label="Borrar">
                      <IconTrash />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="text-xs font-semibold tracking-wide text-muted uppercase mb-2">Agregar compra en cuotas</div>
        <form onSubmit={handleAgregarCompra} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
          <select
            value={tarjetaId}
            onChange={(e) => setTarjetaId(e.target.value)}
            className="w-full bg-card-alt border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-border-strong"
          >
            {tarjetasActivas.length === 0 && <option value="">Agregá una tarjeta primero</option>}
            {tarjetasActivas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Heladera"
            className="w-full bg-card-alt border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-border-strong"
          />
          <div className="flex gap-2">
            <div className="flex rounded-xl border border-border overflow-hidden">
              {(['ARS', 'USD'] as Moneda[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMoneda(m)}
                  className={`px-3 text-xs font-semibold ${moneda === m ? 'bg-accent text-bg' : 'text-muted'}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              inputMode="decimal"
              value={montoTotal}
              onChange={(e) => setMontoTotal(e.target.value)}
              placeholder="Monto total de la compra"
              className="flex-1 bg-card-alt border border-border rounded-xl px-3 py-2 font-mono text-sm outline-none focus:border-border-strong"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted uppercase tracking-wide">Cantidad de cuotas</label>
            <input
              type="number"
              min={1}
              max={60}
              inputMode="numeric"
              value={cuotasTotales}
              onChange={(e) => setCuotasTotales(e.target.value)}
              className="mt-1 w-full bg-card-alt border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-border-strong"
            />
          </div>
          {montoTotal && Number(cuotasTotales) > 0 && (
            <div className="text-[11px] text-muted">
              {cuotasTotales} cuotas de {formatMonto(Number(montoTotal.replace(',', '.')) / Number(cuotasTotales), moneda)}, a partir de este mes
            </div>
          )}
          {error && <p className="text-expense text-sm">{error}</p>}
          <button
            type="submit"
            disabled={guardandoCompra || !tarjetaId}
            className="w-full py-2.5 rounded-xl bg-accent text-bg font-semibold disabled:opacity-60"
          >
            {guardandoCompra ? 'Guardando…' : 'Agregar compra'}
          </button>
        </form>
      </div>
    </div>
  )
}
