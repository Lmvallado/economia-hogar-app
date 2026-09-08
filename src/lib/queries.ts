import { supabase } from './supabaseClient'
import type { Categoria, CompraTarjeta, GastoFijo, Moneda, Movimiento, Tarjeta, TipoMovimiento } from './types'

export async function fetchCategorias(hogarId: string): Promise<Categoria[]> {
  const { data, error } = await supabase.from('categorias').select('*').eq('hogar_id', hogarId).order('orden')
  if (error) throw error
  return data ?? []
}

export async function fetchMovimientosDelRango(
  hogarId: string,
  desde: string,
  hasta: string,
): Promise<Movimiento[]> {
  const { data, error } = await supabase
    .from('movimientos')
    .select('*, categoria:categorias(*), usuario:perfiles(*)')
    .eq('hogar_id', hogarId)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Movimiento[]
}

export interface NuevoMovimiento {
  hogar_id: string
  usuario_id: string
  categoria_id: string | null
  tipo: TipoMovimiento
  monto: number
  moneda: Moneda
  fecha: string
  es_fijo: boolean
  nota: string | null
}

export async function crearMovimiento(m: NuevoMovimiento) {
  const { data, error } = await supabase.from('movimientos').insert(m).select().single()
  if (error) throw error
  return data
}

export async function borrarMovimiento(id: string) {
  const { error } = await supabase.from('movimientos').delete().eq('id', id)
  if (error) throw error
}

export async function fetchGastosFijos(hogarId: string): Promise<GastoFijo[]> {
  const { data, error } = await supabase
    .from('gastos_fijos')
    .select('*, categoria:categorias(*)')
    .eq('hogar_id', hogarId)
    .order('nombre')
  if (error) throw error
  return (data ?? []) as unknown as GastoFijo[]
}

export async function crearGastoFijo(g: Omit<GastoFijo, 'id' | 'categoria'>) {
  const { data, error } = await supabase.from('gastos_fijos').insert(g).select().single()
  if (error) throw error
  return data
}

export async function actualizarGastoFijo(id: string, cambios: Partial<GastoFijo>) {
  const { error } = await supabase.from('gastos_fijos').update(cambios).eq('id', id)
  if (error) throw error
}

/** Carga como movimientos del mes todos los gastos fijos activos que todavía no tengan
 * un movimiento marcado es_fijo=true en ese rango de fechas (evita duplicar). */
export async function generarGastosFijosDelMes(
  hogarId: string,
  usuarioId: string,
  desde: string,
  hasta: string,
): Promise<number> {
  const [fijos, yaCargados] = await Promise.all([
    fetchGastosFijos(hogarId),
    fetchMovimientosDelRango(hogarId, desde, hasta),
  ])

  const activos = fijos.filter((f) => f.activo)
  const nombresYaCargados = new Set(
    yaCargados.filter((m) => m.es_fijo).map((m) => `${m.categoria_id ?? ''}-${m.moneda}-${m.monto}`),
  )

  const aInsertar = activos
    .filter((f) => !nombresYaCargados.has(`${f.categoria_id ?? ''}-${f.moneda}-${f.monto}`))
    .map((f) => ({
      hogar_id: hogarId,
      usuario_id: usuarioId,
      categoria_id: f.categoria_id,
      tipo: 'gasto' as TipoMovimiento,
      monto: f.monto,
      moneda: f.moneda,
      fecha: desde,
      es_fijo: true,
      nota: f.nombre,
    }))

  if (aInsertar.length === 0) return 0

  const { error } = await supabase.from('movimientos').insert(aInsertar)
  if (error) throw error
  return aInsertar.length
}

/* ============ Tarjetas de crédito y cuotas (Etapa 2) ============ */

export async function fetchTarjetas(hogarId: string): Promise<Tarjeta[]> {
  const { data, error } = await supabase
    .from('tarjetas')
    .select('*')
    .eq('hogar_id', hogarId)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function crearTarjeta(t: { hogar_id: string; nombre: string; color?: string }) {
  const { data, error } = await supabase
    .from('tarjetas')
    .insert({ hogar_id: t.hogar_id, nombre: t.nombre, color: t.color ?? '#B9FF66' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function archivarTarjeta(id: string, activa: boolean) {
  const { error } = await supabase.from('tarjetas').update({ activa }).eq('id', id)
  if (error) throw error
}

export async function fetchComprasTarjeta(hogarId: string): Promise<CompraTarjeta[]> {
  const { data, error } = await supabase
    .from('compras_tarjeta')
    .select('*, tarjeta:tarjetas(*), usuario:perfiles(*)')
    .eq('hogar_id', hogarId)
    .order('primer_mes', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as CompraTarjeta[]
}

export interface NuevaCompraTarjeta {
  hogar_id: string
  tarjeta_id: string
  usuario_id: string | null
  descripcion: string
  moneda: Moneda
  monto_cuota: number
  cuotas_totales: number
  primer_mes: string
}

export async function crearCompraTarjeta(c: NuevaCompraTarjeta) {
  const { data, error } = await supabase.from('compras_tarjeta').insert(c).select().single()
  if (error) throw error
  return data
}

export async function borrarCompraTarjeta(id: string) {
  const { error } = await supabase.from('compras_tarjeta').delete().eq('id', id)
  if (error) throw error
}
