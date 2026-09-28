import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, logout } from '../stores/authStore'
import { api, ApiError } from '../services/api'
import { showToast } from '../stores/toastStore'
import { itemsCache, invalidateAll } from '../services/itemsCache'
import { useRealtimeItems } from '../hooks/useRealtimeItems'
import Navbar from '../components/Navbar'
import ItemList from '../components/ItemList'
import ItemForm from '../components/ItemForm'
import useConfirm from '../hooks/useConfirm'

function GlobalError({ children }) {
  if (!children) return null
  return <div className="alert alert-error">{children}</div>
}

/**
 * Página dedicada a la gestión de items.
 * Reutiliza ItemForm — el mismo componente usado en DashboardPage — para
 * demostrar que un formulario puede servir en más de una pantalla.
 */
export default function ItemsPage() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [categorias, setCategories] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [categoriaId, setCategoriaId] = useState('')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  // Último valor ya "comiteado" a debouncedQuery. Evita que el timer del debounce
  // vuelva a poner loading=true (y deje el spinner) si el texto no cambió.
  const committedQuery = useRef('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [ask, confirmDialog] = useConfirm()

  // Mantiene el stock de la lista actualizado en vivo con los eventos realtime.
  useRealtimeItems(setItems)

  const handleOrder = async (item, cantidad) => {
    try {
      const data = await api.pedidos.create({ item_id: item.id, cantidad })
      // Reflejo inmediato con el item devuelto por la API (el WS llega igual).
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, stock: data.item.stock } : it)),
      )
      // Toast verde de confirmación para quien carga el pedido. Los demás
      // navegadores reciben "¡usuario pidió..." por el canal realtime.
      showToast(`Pedido cargado: ${cantidad} × ${item.nombre}`, 'success')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        return
      }
      setError(err.errors?.stock?.[0] ?? err.message ?? 'No se pudo registrar el pedido.')
    }
  }

  useEffect(() => {
    const value = query.trim()
    const t = setTimeout(() => {
      if (committedQuery.current === value) return
      committedQuery.current = value
      setDebouncedQuery(value)
      setPage(1)
      setLoading(true)
      setError(null)
    }, 500)
    return () => clearTimeout(t)
  }, [query])

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

    const params = {
      page,
      per_page: perPage,
      ...(categoriaId ? { categoria_id: Number(categoriaId) } : {}),
      ...(debouncedQuery ? { q: debouncedQuery } : {}),
    }

    itemsCache
      .list(params)
      .then((res) => {
        if (!active) return
        setItems(res.data)
        setMeta(res.meta)
      })
      .catch(guard(() => setError('No se pudieron cargar los ítems.')))
      .finally(() => active && setLoading(false))

    itemsCache
      .listCategorias()
      .then((res) => active && setCategories(res.data))
      .catch(guard(() => {}))

    return () => {
      active = false
    }
  }, [refresh, page, perPage, categoriaId, debouncedQuery])

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

  const resetPageAndReload = () => {
    setPage(1)
    setLoading(true)
    setError(null)
  }

  const changeCategoria = (value) => {
    setCategoriaId(value)
    resetPageAndReload()
  }

  const changeQuery = (value) => {
    setQuery(value)
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
        <GlobalError>{error}</GlobalError>

        {confirmDialog}

        <ItemList
          items={items}
          loading={loading}
          categorias={categorias}
          meta={meta}
          categoriaId={categoriaId}
          onCategoriaChange={changeCategoria}
          query={query}
          onQueryChange={changeQuery}
          onPageChange={goToPage}
          onPerPageChange={changePerPage}
          onRefresh={reload}
          onNew={() => setEditing('nuevo')}
          onEdit={(item) => setEditing(item.id)}
          onDelete={handleDelete}
          onOrder={handleOrder}
        />
        {editing !== null && (
          <ItemForm
            itemId={editing === 'nuevo' ? null : editing}
            categorias={categorias}
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