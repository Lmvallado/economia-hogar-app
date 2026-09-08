import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  actualizarGastoFijo,
  crearGastoFijo,
  fetchCategorias,
  fetchGastosFijos,
  generarGastosFijosDelMes,
} from '../lib/queries'
import { formatMonto, rangoDelMes } from '../lib/format'
import type { Categoria, GastoFijo, Moneda } from '../lib/types'

export default function GastosFijos() {
  const { hogar, perfil } = useAuth()
  const { version, bump } = useData()
  const [gastos, setGastos] = useState<GastoFijo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState<Moneda>('ARS')
  const [categoriaId, setCategoriaId] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!hogar) return
    setCargando(true)
    Promise.all([fetchGastosFijos(hogar.id), fetchCategorias(hogar.id)])
      .then(([g, c]) => {
        setGastos(g)
        setCategorias(c)
        const primeraGasto = c.find((cat) => cat.tipo === 'gasto')
        if (primeraGasto) setCategoriaId((prev) => prev || primeraGasto.id)
      })
      .finally(() => setCargando(false))
  }, [hogar, version])

  const categoriasGasto = useMemo(() => categorias.filter((c) => c.tipo === 'gasto'), [categorias])

  async function handleAgregar(e: FormEvent) {
    e.preventDefault()
    if (!hogar) return
    const montoNum = Number(monto.replace(',', '.'))
    if (!montoNum || montoNum <= 0) return
    setGuardando(true)
    try {
      await crearGastoFijo({
        hogar_id: hogar.id,
        categoria_id: categoriaId || null,
        nombre,
        monto: montoNum,
        moneda,
        activo: true,
      })
      setNombre('')
      setMonto('')
      bump()
    } finally {
      setGuardando(false)
    }
  }

  async function handleToggleActivo(g: GastoFijo) {
    await actualizarGastoFijo(g.id, { activo: !g.activo })
    bump()
  }

  async function handleGenerar() {
    if (!hogar || !perfil) return
    setGenerando(true)
    setMensaje(null)
    try {
      const { desde, hasta } = rangoDelMes()
      const cantidad = await generarGastosFijosDelMes(hogar.id, perfil.id, desde, hasta)
      setMensaje(
        cantidad === 0
          ? 'Ya estaban todos cargados este mes.'
          : `Se cargaron ${cantidad} gasto${cantidad === 1 ? '' : 's'} fijo${cantidad === 1 ? '' : 's'} del mes.`,
      )
      bump()
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={handleGenerar}
        disabled={generando}
        className="w-full py-3 rounded-xl bg-accent text-bg font-semibold disabled:opacity-60"
      >
        {generando ? 'Cargando…' : 'Cargar gastos fijos del mes'}
      </button>
      {mensaje && <p className="text-xs text-muted -mt-2">{mensaje}</p>}

      <div>
        <div className="text-xs font-semibold tracking-wide text-muted uppercase mb-2">Tus gastos fijos</div>
        {cargando ? (
          <div className="text-sm text-muted">Cargando…</div>
        ) : gastos.length === 0 ? (
          <div className="text-sm text-muted bg-card border border-border rounded-2xl p-4">
            Todavía no cargaste gastos fijos (alquiler, expensas, seguros, etc.).
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {gastos.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3"
              >
                <div className="min-w-0">
                  <div className={`text-sm font-medium truncate ${g.activo ? '' : 'text-muted line-through'}`}>
                    {g.nombre}
                  </div>
                  <div className="text-[11px] text-muted truncate">{g.categoria?.nombre ?? 'Sin categoría'}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-sm font-semibold">{formatMonto(Number(g.monto), g.moneda)}</span>
                  <button
                    onClick={() => handleToggleActivo(g)}
                    className={`text-[10px] px-2 py-1 rounded-full border ${
                      g.activo ? 'border-accent text-accent' : 'border-border text-muted'
                    }`}
                  >
                    {g.activo ? 'Activo' : 'Pausado'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-semibold tracking-wide text-muted uppercase mb-2">Agregar gasto fijo</div>
        <form onSubmit={handleAgregar} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Alquiler"
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
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Monto"
              className="flex-1 bg-card-alt border border-border rounded-xl px-3 py-2 font-mono text-sm outline-none focus:border-border-strong"
            />
          </div>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full bg-card-alt border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-border-strong"
          >
            {categoriasGasto.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={guardando}
            className="w-full py-2.5 rounded-xl bg-white/10 text-sm font-semibold disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Agregar'}
          </button>
        </form>
      </div>
    </div>
  )
}
