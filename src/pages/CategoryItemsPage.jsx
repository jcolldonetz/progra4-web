import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth, logout } from '../stores/authStore'
import { api, ApiError } from '../services/api'
import { itemsCache, invalidateAll } from '../services/itemsCache'
import Navbar from '../components/Navbar'
import ItemList from '../components/ItemList'
import ItemForm from '../components/ItemForm'
import useConfirm from '../hooks/useConfirm'

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
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [ask, confirmDialog] = useConfirm()

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

    itemsCache
      .listByCategoria(id, { page, per_page: perPage })
      .then((res) => {
        if (!active) return
        setItems(res.data)
        setMeta(res.meta)
      })
      .catch(guard(() => setError('No se pudieron cargar los ítems de la categoría.')))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [id, refresh, page, perPage])

  const reload = () => {
    invalidateAll()
    setPage(1)
    setLoading(true)
    setError(null)
    setRefresh((r) => r + 1)
  }

  const goToPage = (next) => {
    setPage(next)
    setLoading(true)
    setError(null)
  }

  const changePerPage = (n) => {
    setPerPage(n)
    setPage(1)
    setLoading(true)
    setError(null)
  }

  const handleDelete = async (item) => {
    const ok = await ask({
      title: 'Eliminar ítem',
      message: `¿Eliminar el ítem "${item.nombre}"?`,
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
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
          <Link
            className="btn btn-icon"
            to="/categorias"
            aria-label="Volver a categorías"
            title="Volver a categorías"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </div>

        <GlobalError>{error}</GlobalError>

        {confirmDialog}

        <ItemList
          items={items}
          loading={loading}
          categorias={categoria ? [categoria] : []}
          titulo={categoria ? `Ítems de ${categoria.nombre}` : 'Ítems'}
          meta={meta}
          onPageChange={goToPage}
          onPerPageChange={changePerPage}
          onRefresh={reload}
          onNew={() => setEditing('nuevo')}
          onEdit={(item) => setEditing(item.id)}
          onDelete={handleDelete}
        />
        {editing !== null && (
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