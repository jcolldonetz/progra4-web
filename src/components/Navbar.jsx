import { NavLink } from 'react-router-dom'
import { LayoutDashboard, LogOut, Package, Tags } from 'lucide-react'
import { useAuth, logout } from '../stores/authStore'
import IconButton from './IconButton'

const links = [
  { to: '/', end: true, label: 'Panel', icon: LayoutDashboard },
  { to: '/items', label: 'Ítems', icon: Package },
  { to: '/categorias', label: 'Categorías', icon: Tags },
]

/**
 * Navegación compartida por las páginas del panel.
 *  - Escritorio: barra superior con marca, enlaces (ícono + texto), usuario y salir.
 *  - Móvil: encabezado compacto + barra flotante inferior con Panel/Ítems/Categorías.
 * La visibilidad se alterna con CSS (media queries), no con JavaScript.
 */
export default function Navbar() {
  const { user } = useAuth()

  const logoutButton = <IconButton icon={LogOut} label="Cerrar sesión" onClick={logout} />

  return (
    <>
      <header className="navbar only-desktop">
        <div className="navbar-left">
          <span className="navbar-brand">Gestión de Ítems</span>
          <nav className="navbar-links">
            {links.map(({ to, end, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} className="nav-link">
                <Icon size={16} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="navbar-right">
          <span className="navbar-user">Hola, {user?.username}</span>
          {logoutButton}
        </div>
      </header>

      <header className="mobile-header">
        <span className="navbar-brand">Gestión de Ítems</span>
        <div className="navbar-right">
          <span className="navbar-user">Hola, {user?.username}</span>
          {logoutButton}
        </div>
      </header>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {links.map(({ to, end, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className="bottom-nav-link">
            <Icon size={22} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}