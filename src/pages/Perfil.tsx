import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Perfil() {
  const { perfil, hogar, user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSalir() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-bg text-text flex justify-center">
      <div className="w-full max-w-md px-5 pt-8 pb-10 flex flex-col gap-5">
        <button onClick={() => navigate(-1)} className="text-sm text-muted self-start">
          ← Volver
        </button>

        <h1 className="font-display text-xl font-bold">Hogar y cuenta</h1>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-[11px] text-muted uppercase tracking-wide">Hogar</div>
          <div className="text-lg font-semibold mt-1">{hogar?.nombre ?? '—'}</div>
          <div className="text-sm text-muted mt-3">Código para invitar a tu pareja</div>
          <div className="font-mono text-2xl tracking-widest mt-1">{hogar?.codigo_invitacion ?? '—'}</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-[11px] text-muted uppercase tracking-wide">Tu cuenta</div>
          <div className="text-sm mt-1">{perfil?.nombre}</div>
          <div className="text-sm text-muted">{user?.email}</div>
        </div>

        <button onClick={handleSalir} className="w-full py-3 rounded-xl border border-border text-sm font-semibold text-expense">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
