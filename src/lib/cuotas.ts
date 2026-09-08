import type { CompraTarjeta, Moneda } from './types'

/** Primer día del mes de una fecha dada (o de hoy). */
export function primerDiaDelMes(fecha = new Date()): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1)
}

export function sumarMeses(fecha: Date, cantidad: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + cantidad, 1)
}

export function toISOFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

function parseFechaLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Número de mes (0-indexed) de una cuota dada, respecto al primer mes de la compra. */
function numeroDeCuotaEnMes(compra: CompraTarjeta, mes: Date): number | null {
  const inicio = parseFechaLocal(compra.primer_mes)
  const diffMeses = (mes.getFullYear() - inicio.getFullYear()) * 12 + (mes.getMonth() - inicio.getMonth())
  if (diffMeses < 0 || diffMeses >= compra.cuotas_totales) return null
  return diffMeses + 1
}

/** Si la compra tiene una cuota que cae en el mes dado, devuelve el número de esa cuota (1-indexed). */
export function cuotaEnMes(compra: CompraTarjeta, mes: Date): number | null {
  return numeroDeCuotaEnMes(compra, mes)
}

export function nombreMesCorto(fecha: Date): string {
  const s = new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit' }).format(fecha)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export interface MesProyectado {
  mes: Date
  totales: Record<Moneda, number>
  items: { compra: CompraTarjeta; numeroCuota: number }[]
}

/** Arma la proyección de los próximos `cantidadMeses` meses (incluyendo el actual). */
export function proyectarMeses(compras: CompraTarjeta[], cantidadMeses = 6, desde = new Date()): MesProyectado[] {
  const inicio = primerDiaDelMes(desde)
  const meses: MesProyectado[] = []
  for (let i = 0; i < cantidadMeses; i++) {
    const mes = sumarMeses(inicio, i)
    const items: MesProyectado['items'] = []
    const totales: Record<Moneda, number> = { ARS: 0, USD: 0 }
    for (const compra of compras) {
      const numeroCuota = cuotaEnMes(compra, mes)
      if (numeroCuota === null) continue
      items.push({ compra, numeroCuota })
      totales[compra.moneda] += Number(compra.monto_cuota)
    }
    meses.push({ mes, totales, items })
  }
  return meses
}
