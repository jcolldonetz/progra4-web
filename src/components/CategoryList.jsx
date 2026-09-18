import { Link } from 'react-router-dom'
import { List, Pencil, Plus, Trash2 } from 'lucide-react'
import IconButton from './IconButton'

function Spinner() {
  return <div className="spinner" role="status" aria-label="Cargando" />
}

/**
 * Muestra las categorías con su items_count.
 * En escritorio usa una tabla; en móvil, una lista de tarjetas (según CSS).
 * Se reutiliza en el Dashboard y en la página Categorías.
 */
export default function CategoryList({ items, loading, onNew, onEdit, onDelete }) {
  if (loading) return <Spinner />

  const header = (
    <div className="page-header">
      <h2>Categorías</h2>
      <IconButton icon={Plus} label="Nueva categoría" variant="primary" onClick={onNew} />
    </div>
  )

  if (items.length === 0) {
    return (
      <div className="page">
        {header}
        <p className="empty">No hay categorías registradas.</p>
      </div>
    )
  }

  const actions = (item) => (
    <>
      <Link
        className="btn btn-icon"
        to={`/categorias/${item.id}/items`}
        aria-label="Ver ítems"
        title="Ver ítems"
      >
        <List size={18} aria-hidden="true" />
      </Link>
      <IconButton icon={Pencil} label="Editar" onClick={() => onEdit(item)} />
      <IconButton
        icon={Trash2}
        label="Eliminar"
        variant="danger"
        onClick={() => onDelete(item)}
      />
    </>
  )

  return (
    <div className="page">
      {header}

      <div className="only-desktop">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th className="num">Ítems</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nombre}</td>
                <td className="num">{item.items_count}</td>
                <td className="actions">{actions(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cards">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <div className="card-head">
              <h3 className="card-title">{item.nombre}</h3>
              <span className="card-badge">#{item.id}</span>
            </div>
            <p className="card-meta">
              {item.items_count} {item.items_count === 1 ? 'ítem' : 'ítems'}
            </p>
            <div className="card-actions">{actions(item)}</div>
          </article>
        ))}
      </div>
    </div>
  )
}