function formatPrice(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(num)
}

function Spinner() {
  return <div className="spinner" role="status" aria-label="Cargando" />
}

export default function ItemList({ items, loading, onNew, onEdit, onDelete }) {
  if (loading) return <Spinner />

  if (items.length === 0) {
    return (
      <>
        <div className="page-header">
          <h2>Ítems</h2>
          <button type="button" className="btn btn-primary" onClick={onNew}>
            + Nuevo ítem
          </button>
        </div>
        <p className="empty">No hay ítems registrados.</p>
      </>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Ítems</h2>
        <button type="button" className="btn btn-primary" onClick={onNew}>
          + Nuevo ítem
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th className="num">Precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.nombre}</td>
              <td className="num">{formatPrice(item.precio)}</td>
              <td className="actions">
                <button type="button" className="btn btn-small" onClick={() => onEdit(item)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={() => onDelete(item)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}