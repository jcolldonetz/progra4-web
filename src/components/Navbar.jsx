import { NavLink } from 'react-router-dom'
import { useAuth, logout } from '../stores/authStore'

/**
 * Barra de navegación superior compartida por todas las páginas del panel.
 * NavLink marca automáticamente con "active" la ruta en la que estamos.
 */
export default function Navbar() {
  const { user } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="navbar-brand">Gestión de Ítems</span>
        <nav className="navbar-links">
          <NavLink to="/" end className="nav-link">
            Panel
          </NavLink>
          <NavLink to="/items" className="nav-link">
            Ítems
          </NavLink>
          <NavLink to="/categorias" className="nav-link">
            Categorías
          </NavLink>
        </nav>
      </div>
      <div className="navbar-right">
        <span className="navbar-user">Hola, {user?.username}</span>
        <button type="button" className="btn btn-small" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}