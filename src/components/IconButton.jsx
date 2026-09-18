/**
 * Botón cuadrado de solo ícono, reutilizable.
 * El texto visible se reemplaza por un ícono; la etiqueta se expone vía
 * aria-label y title para mantener la accesibilidad y mostrar tooltip.
 *
 * Props:
 *  - icon: componente de ícono (p. ej. de lucide-react).
 *  - label: texto accesible (aria-label/title).
 *  - variant: 'default' | 'primary' | 'danger'.
 *  - size: 'normal' | 'small'.
 *  - El resto de props se pasan al <button> (onClick, disabled, type...).
 */
export default function IconButton({
  icon: Icon,
  label,
  variant = 'default',
  size = 'normal',
  className = '',
  ...props
}) {
  const variantClass =
    variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : ''
  const sizeClass = size === 'small' ? 'btn-small' : ''

  return (
    <button
      type="button"
      className={`btn btn-icon ${variantClass} ${sizeClass} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon size={size === 'small' ? 16 : 18} aria-hidden="true" />
    </button>
  )
}