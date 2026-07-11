export const hasAnyRole = (requiredRoles: unknown, currentRoles: string[]) => {
  if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) return true
  return (
    currentRoles.includes('super_admin') ||
    requiredRoles.some((role) => currentRoles.includes(String(role)))
  )
}
