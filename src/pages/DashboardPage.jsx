import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, logout } from '../stores/authStore'
import { api, ApiError } from '../services/api'
import ItemList from '../components/ItemList'
import ItemForm from '../components/ItemForm'

function GlobalError({ children }) {
  if (!children) return null
  return <div className="alert alert-error">{children}</div>
}

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    let active = true

    api.items
      .list()
      .then((data) => {
        if (active) setItems(data)
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 401) {
          logout()
          return
        }
        setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [refresh])

  const reload = () => {
    setLoading(true)
    setError(null)
    setRefresh((r) => r + 1)
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar el ítem "${item.nombre}"?`)) return
    try {
      await api.items.remove(item.id)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

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
        <GlobalError>{error}</GlobalError>

        {editing === null ? (
          <ItemList
            items={items}
            loading={loading}
            onNew={() => setEditing('nuevo')}
            onEdit={(item) => setEditing(item.id)}
            onDelete={handleDelete}
          />
        ) : (
          <ItemForm
            itemId={editing === 'nuevo' ? null : editing}
            onSaved={() => {
              setEditing(null)
              reload()
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </main>
    </div>
  )
}