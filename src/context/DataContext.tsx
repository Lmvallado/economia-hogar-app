import { createContext, useContext, useState, type ReactNode } from 'react'

interface DataContextValue {
  version: number
  bump: () => void
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

/** Contador simple que se incrementa cada vez que se carga/borra un movimiento
 * o se edita un gasto fijo, para que Dashboard/Movimientos/GastosFijos vuelvan a
 * pedir los datos sin tener que pasar callbacks por todos lados. */
export function DataProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const bump = () => setVersion((v) => v + 1)
  return <DataContext.Provider value={{ version, bump }}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de <DataProvider>')
  return ctx
}
