import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { IconExchange, IconHome, IconPlus, IconRepeat } from './icons'
import MovimientoModal from './MovimientoModal'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Inicio', Icon: IconHome },
  { to: '/movimientos', label: 'Movimientos', Icon: IconExchange },
  { to: '/gastos-fijos', label: 'Gastos fijos', Icon: IconRepeat },
]

export default function Shell() {
  const [modalAbierto, setModalAbierto] = useState(false)
  const { hogar } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg text-text flex justify-center">
      <div className="relative w-full max-w-md min-h-screen flex flex-col">
        <header className="px-5 pt-6 pb-2 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium tracking-widest text-muted uppercase">
              {hogar?.nombre ?? 'Economía Hogar'}
            </div>
            <h1 className="font-display text-xl font-bold mt-0.5">Hola, equipo</h1>
          </div>
          <button
            onClick={() => navigate('/hogar')}
            className="text-[11px] text-muted border border-border rounded-full px-3 py-1.5 hover:border-border-strong transition-colors"
          >
            Código: {hogar?.codigo_invitacion ?? '—'}
          </button>
        </header>

        <main className="flex-1 px-5 pb-28 pt-2">
          <Outlet />
        </main>

        <button
          onClick={() => setModalAbierto(true)}
          aria-label="Cargar movimiento"
          className="absolute right-5 bottom-[92px] w-[52px] h-[52px] rounded-2xl bg-accent text-bg flex items-center justify-center shadow-[0_10px_24px_rgba(0,0,0,0.4)] active:scale-95 transition-transform"
        >
          <IconPlus />
        </button>

        <nav className="sticky bottom-0 bg-card-alt border-t border-border">
          <div className="flex items-center justify-around h-[68px] pb-1.5">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 text-[10px] ${isActive ? 'text-accent' : 'text-muted-2'}`
                }
              >
                <Icon />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {modalAbierto && <MovimientoModal onClose={() => setModalAbierto(false)} />}
      </div>
    </div>
  )
}
