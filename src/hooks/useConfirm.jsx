import { useCallback, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

/**
 * Hook que reemplaza a window.confirm por un diálogo propio de la app.
 *
 * Devuelve [ask, confirmDialog]:
 *  - ask(opciones): abre el diálogo y devuelve una Promise que resuelve a
 *    true si el usuario confirma o false si cancela. Se puede pasar un
 *    string (mensaje simple) o un objeto con las mismas props de
 *    ConfirmDialog (title, message, confirmLabel, cancelLabel, danger).
 *  - confirmDialog: elemento JSX que se debe renderizar en la página
 *    (por ejemplo {confirmDialog}) para mostrar el diálogo.
 */
export default function useConfirm() {
  const [options, setOptions] = useState(null)
  const resolverRef = useRef(null)

  const settle = useCallback((result) => {
    setOptions(null)
    resolverRef.current?.(result)
    resolverRef.current = null
  }, [])

  const ask = useCallback((opts = {}) => {
    const normalized = typeof opts === 'string' ? { message: opts } : opts
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setOptions(normalized)
    })
  }, [])

  const confirmDialog = options ? (
    <ConfirmDialog
      {...options}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null

  return [ask, confirmDialog]
}