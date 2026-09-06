import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="app-layout">
      <header className="navbar">
        <div className="navbar-brand">Gestión de Ítems</div>
        <div className="navbar-right">
          <span className="navbar-user">Hola, {user?.username}</span>
          <button type="button" className="btn btn-small" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
