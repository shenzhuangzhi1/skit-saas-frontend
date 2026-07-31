import type { RouteMeta } from 'vue-router'
import { Icon } from '@/components/Icon'
import {
  PRODUCT_ROUTE_ICON_NAMES,
  clampProductIcon
} from '@/components/Icon/src/productIconDomains'
import { useI18n } from '@/hooks/web/useI18n'

export const useRenderMenuTitle = () => {
  const renderMenuTitle = (meta: RouteMeta) => {
    const { t } = useI18n()
    const { title = 'Please set title', icon } = meta

    return icon ? (
      <>
        <Icon icon={clampProductIcon(meta.icon, PRODUCT_ROUTE_ICON_NAMES)}></Icon>
        <span class="v-menu__title overflow-hidden overflow-ellipsis whitespace-nowrap">
          {t(title as string)}
        </span>
      </>
    ) : (
      <span class="v-menu__title overflow-hidden overflow-ellipsis whitespace-nowrap">
        {t(title as string)}
      </span>
    )
  }

  return {
    renderMenuTitle
  }
}
