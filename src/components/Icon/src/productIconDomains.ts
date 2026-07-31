export const INPUT_PASSWORD_ICON_NAMES = Object.freeze(['ep:hide', 'ep:view'] as const)

export const PRODUCT_ROUTE_ICON_NAMES = Object.freeze([
  'ep:bell',
  'ep:coin',
  'ep:data-analysis',
  'ep:document',
  'ep:folder-opened',
  'ep:histogram',
  'ep:home-filled',
  'ep:key',
  'ep:list',
  'ep:message',
  'ep:monitor',
  'ep:office-building',
  'ep:setting',
  'ep:user',
  'ep:user-filled',
  'ep:video-camera',
  'ep:video-play',
  'ep:wallet',
  'ep:warning'
] as const)

export const CONTEXT_MENU_ICON_NAMES = Object.freeze([
  'ep:close',
  'ep:d-arrow-left',
  'ep:d-arrow-right',
  'ep:discount',
  'ep:minus',
  'ep:refresh'
] as const)

export const ADMIN_ACTION_ICON_NAMES = Object.freeze(['ep:edit', 'ep:view'] as const)

export const clampProductIcon = <IconName extends string>(
  icon: unknown,
  allowedIcons: readonly IconName[]
): IconName | undefined => {
  if (typeof icon !== 'string') return undefined
  return allowedIcons.some((allowedIcon) => allowedIcon === icon) ? (icon as IconName) : undefined
}
