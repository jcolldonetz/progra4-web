export function GlobalError({ children }) {
  if (!children) return null
  return <div className="alert alert-error">{children}</div>
}

export function FieldError({ field, errors }) {
  if (!field || !errors || !errors[field]) return null
  return <div className="field-error">{errors[field].join(', ')}</div>
}

export function Spinner() {
  return <div className="spinner" role="status" aria-label="Cargando" />
}
