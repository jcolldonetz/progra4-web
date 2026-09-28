import { useEffect } from 'react'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useAuth } from '../stores/authStore'
import { showToast, useToasts } from '../stores/toastStore'
import { subscribe } from '../services/realtime'
import { connect, disconnect, useRealtime } from '../stores/realtimeStore'

/**
 * Notificaciones "realtime": la barra que flota arriba a la derecha.
 *
 * - Montado UNA vez en main.jsx (por eso no tiene layout propio).
 * - Enlazado con la sesión: cuando hay token conecta el WebSocket; al cerrar
 *   sesión (o desmontar) lo desconecta. Solo puede haber UN socket: el store
 *   es un singleton (módulo) y los reintentos se encadenan de a uno.
 * - Por cada evento `pedido.creado` de OTRO usuario muestra un toast con el
 *   usuario, el ítem y la cantidad. El evento del propio usuario NO muestra
 *   toast aquí: ese pedido ya confirmó con el toast verde de "cargado".
 * - Si el canal se cae muestra un aviso persistente de reconexión.
 */
export default function RealtimeToasts() {
  const { user, isAuthenticated } = useAuth()
  const { status } = useRealtime()
  const toasts = useToasts()

  useEffect(() => {
    if (!isAuthenticated) {
      disconnect()
      return undefined
    }
    connect()
    return () => disconnect()
  }, [isAuthenticated])

  useEffect(() => {
    // Se re-suscribe si cambia el usuario: así el filtro "¿es mío?" (abajo)
    // siempre compara contra el usuario actual de la sesión.
    return subscribe((payload) => {
      if (!payload || payload.type !== 'pedido.creado') return
      const { pedido, item, username } = payload
      if (!pedido || !item) return

      // Lo cargó ESTE navegador: el toast verde de confirmación ya lo mostró
      // la página al recibir la respuesta del POST. No duplicamos aviso.
      if (user && username && username === user.username) return

      showToast(`¡${username || 'Alguien'} pidió ${pedido.cantidad} × ${item.nombre}!`, 'info')
    })
  }, [user])

  const reconnecting = status !== 'connected'

  return (
    <div className="realtime-region" role="status" aria-live="polite">
      {reconnecting && (
        <div className="toast toast-warning">
          <RefreshCw size={16} aria-hidden="true" />
          <span>Reconectando a notificaciones realtime…</span>
        </div>
      )}
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast${toast.kind === 'success' ? ' toast-success' : ''}`}
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}