// Componente compartido para mostrar el nombre de un usuario,
// con indicador "(inactivo)" cuando isActive === false.
// Útil para que cualquier vista que renderice nombres muestre
// claramente cuándo un user fue desactivado.

type UserMinimal = {
  nombre?:   string | null
  apellido?: string | null
  isActive?: boolean
}

interface UserNameProps {
  user:       UserMinimal | null | undefined
  className?: string
  fallback?:  string   // texto si user es null/undefined
}

export function UserName({ user, className = "", fallback = "—" }: UserNameProps) {
  if (!user) return <span className={className}>{fallback}</span>

  const nombre = `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Usuario'

  // Solo marcamos como inactivo si explícitamente isActive === false.
  // Si viene undefined (la query no trajo el campo), tratamos como activo
  // para no mostrar falsos positivos.
  const inactivo = user.isActive === false

  if (inactivo) {
    return (
      <span className={className}>
        <span className="text-slate-400 italic">{nombre}</span>
        <span className="ml-1 text-[10px] font-normal text-slate-400 not-italic">(inactivo)</span>
      </span>
    )
  }

  return <span className={className}>{nombre}</span>
}