import type { Moneda } from './types'

export function formatMonto(monto: number, moneda: Moneda) {
  const simbolo = moneda === 'USD' ? 'US$' : '$'
  const formateado = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(monto))
  return `${simbolo}${formateado}`
}

export function nombreMes(fecha = new Date()) {
  const s = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(fecha)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function rangoDelMes(fecha = new Date()) {
  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
  const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
  const toISO = (d: Date) => d.toISOString().slice(0, 10)
  return { desde: toISO(inicio), hasta: toISO(fin) }
}
