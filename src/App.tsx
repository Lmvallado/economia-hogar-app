import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Shell from './components/Shell'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Movimientos from './pages/Movimientos'
import GastosFijos from './pages/GastosFijos'
import Perfil from './pages/Perfil'

function Cargando() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-muted text-sm">Cargando…</div>
  )
}

function Rutas() {
  const { loading, user, perfil, hogar } = useAuth()

  if (loading) return <Cargando />

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  if (!perfil?.hogar_id || !hogar) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/hogar" element={<Perfil />} />
      <Route element={<Shell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/gastos-fijos" element={<GastosFijos />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <DataProvider>
          <Rutas />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
