import { useState } from 'react'
import { STORAGE_MODES } from '../auth/persistence'

export default function PersistenceSelector({ value, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="persist-selector">
      <button
        type="button"
        className="btn btn-small persist-toggle"
        onClick={() => setOpen((o) => !o)}
      >
        ¿Dónde guardar la sesión? <span className="persist-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="persist-options">
          <p className="persist-hint">
            Mecanismo del navegador donde se guarda el token de acceso (demo de la clase).
          </p>
          {STORAGE_MODES.map((m) => (
            <label key={m.id} className="persist-option">
              <input
                type="radio"
                name="auth-mode"
                value={m.id}
                checked={value === m.id}
                onChange={() => onChange(m.id)}
              />
              <span className="persist-option-text">
                <strong>{m.label}</strong>
                <small>{m.desc}</small>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}