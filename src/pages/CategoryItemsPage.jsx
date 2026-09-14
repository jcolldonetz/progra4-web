import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth, logout } from '../stores/authStore'
import { api, ApiError } from '../services/api'
import Navbar from '../components/Navbar'
import ItemList from '../components/ItemList'
import ItemForm from '../components/ItemForm'

function GlobalError({ children }) {
  if (!children) return null
  return <div className="alert alert-error">{children}</div>
}

/**
 * /categorias/{id}/items — página que lista los items de una categoría
 * (lado "N" de la relación 1:N). Reutiliza ItemForm para crear un item y
 * que quede asociado de entrada a esta categoría (initialCategoriaId),
 * demostrando que el mismo formulario funciona en más de una pantalla.
 */
export default function CategoryItemsPage() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()

  const [categoria, setCategoria] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    const guard = (fn) => (err) => {
      if (!active) return
      if (err instanceof ApiError && err.status === 401) {
        logout()
        return
      }
      fn()
    }

    api.categorias
      .get(id)
      .then((data) => active && setCategoria(data))
      .catch(guard(() => setError('No se pudo cargar la categoría.')))

    api.categorias
      .items(id)
      .then((data) => active && setItems(data))
      .catch(guard(() => setError('No se pudieron cargar los ítems de la categoría.')))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [id, refresh])

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
      <Navbar />
      <main className="content">
        <div className="page-header">
          <h2>{categoria ? `Items de: ${categoria.nombre}` : 'Items de la categoría'}</h2>
          <Link className="btn btn-small" to="/categorias">
            Volver a categorías
          </Link>
        </div>

        <GlobalError>{error}</GlobalError>

        {editing === null ? (
          <ItemList
            items={items}
            loading={loading}
            categorias={categoria ? [categoria] : []}
            titulo={categoria ? `Ítems de ${categoria.nombre}` : 'Ítems'}
            onNew={() => setEditing('nuevo')}
            onEdit={(item) => setEditing(item.id)}
            onDelete={handleDelete}
          />
        ) : (
          <ItemForm
            itemId={editing === 'nuevo' ? null : editing}
            categorias={categoria ? [categoria] : []}
            initialCategoriaId={categoria ? categoria.id : null}
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