import { useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'
import IconButton from './IconButton'

/**
 * Diálogo de confirmación reutilizable que reemplaza a window.confirm.
 * Se muestra como un overlay fijo y siempre queda centrado vertical y
 * horizontalmente, siguiendo el tema visual de la app (variables de CSS).
 *
 * Props:
 *  - title: texto del encabezado (default "Confirmar").
 *  - message: mensaje de la confirmación.
 *  - confirmLabel: texto del botón de confirmar (default "Confirmar").
 *  - cancelLabel: texto del botón de cancelar (default "Cancelar").
 *  - danger: si es true, el botón de confirmar usa el estilo de peligro.
 *  - onConfirm: se llama al aceptar.
 *  - onCancel: se llama al cancelar (botón, clic fuera o tecla Escape).
 */
export default function ConfirmDialog({
  title = 'Confirmar',
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}) {
  const overlayRef = useRef(null)

  useEffect(() => {
    overlayRef.current?.querySelector('button')?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div
      ref={overlayRef}
      className="confirm-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel()
      }}
    >
      <div
        className="confirm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h2 id="confirm-title" className="confirm-title">
          {title}
        </h2>
        <p id="confirm-message" className="confirm-message">
          {message}
        </p>
        <div className="confirm-actions">
          <IconButton icon={X} label={cancelLabel} onClick={onCancel} />
          <IconButton
            icon={Check}
            label={confirmLabel}
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>
  )
}