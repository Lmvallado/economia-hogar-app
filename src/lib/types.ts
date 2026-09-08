export type Moneda = 'ARS' | 'USD'
export type TipoMovimiento = 'ingreso' | 'gasto'

export interface Hogar {
  id: string
  nombre: string
  codigo_invitacion: string
  created_at: string
}

export interface Perfil {
  id: string
  hogar_id: string
  nombre: string
  created_at: string
}

export interface Categoria {
  id: string
  hogar_id: string
  nombre: string
  tipo: TipoMovimiento
  color: string
  orden: number
}

export interface Movimiento {
  id: string
  hogar_id: string
  usuario_id: string
  categoria_id: string | null
  tipo: TipoMovimiento
  monto: number
  moneda: Moneda
  fecha: string // yyyy-mm-dd
  es_fijo: boolean
  nota: string | null
  created_at: string
  // joins opcionales
  categoria?: Categoria | null
  usuario?: Perfil | null
}

export interface GastoFijo {
  id: string
  hogar_id: string
  categoria_id: string | null
  nombre: string
  monto: number
  moneda: Moneda
  activo: boolean
  categoria?: Categoria | null
}
