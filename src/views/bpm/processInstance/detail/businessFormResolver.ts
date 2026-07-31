import { defineAsyncComponent } from 'vue'
import type { AsyncComponentLoader } from 'vue'

// BPM is quarantined from the product Router, but its source remains type-safe.
// This focused resolver supports the BPM custom-form contract without restoring
// the former all-views backend-menu component registry.
const businessFormModules = import.meta.glob(['../../**/*.vue', '../../../crm/**/*.vue']) as Record<
  string,
  AsyncComponentLoader
>

export const resolveBusinessFormComponent = (componentPath: string) => {
  const normalizedPath = componentPath.startsWith('/') ? componentPath : `/${componentPath}`
  const moduleLoader = Object.entries(businessFormModules).find(([modulePath]) =>
    modulePath.endsWith(normalizedPath)
  )?.[1]

  return moduleLoader ? defineAsyncComponent(moduleLoader) : undefined
}
