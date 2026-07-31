import { PlaceholderModel } from './types'
import { FormSchema } from '@/types/form'
import { ColProps } from '@/types/components'

/**
 *
 * @param schema 对应组件数据
 * @returns 返回提示信息对象
 * @description 用于自动设置placeholder
 */
export const setTextPlaceholder = (schema: FormSchema): PlaceholderModel => {
  const { t } = useI18n()
  if (schema.component === 'Input' || schema.component === 'InputNumber') {
    return {
      placeholder: t('common.inputText') + schema.label
    }
  }
  return {}
}

/**
 *
 * @param col 内置栅格
 * @returns 返回栅格属性
 * @description 合并传入进来的栅格属性
 */
export const setGridProp = (col: ColProps = {}): ColProps => {
  const colProps: ColProps = {
    // 如果有span，代表用户优先级更高，所以不需要默认栅格
    ...(col.span
      ? {}
      : {
          xs: 24,
          sm: 12,
          md: 12,
          lg: 12,
          xl: 12
        }),
    ...col
  }
  return colProps
}

/**
 *
 * @param item 传入的组件属性
 * @returns 默认添加 clearable 属性
 */
export const setComponentProps = (item: FormSchema): Recordable => {
  const componentProps: Recordable = {
    clearable: true,
    ...item.componentProps
  }
  // 需要删除额外的属性
  delete componentProps?.slots
  return componentProps
}

/**
 *
 * @param schema Form表单结构化数组
 * @param formModel FormModel
 * @returns FormModel
 * @description 生成对应的formModel
 */
export const initModel = (schema: FormSchema[], formModel: Recordable) => {
  const model: Recordable = { ...formModel }
  schema.map((v) => {
    // 如果是hidden，就删除对应的值
    if (v.hidden) {
      delete model[v.field]
    } else if (v.component) {
      const hasField = Reflect.has(model, v.field)
      // 如果先前已经有值存在，则不进行重新赋值，而是采用现有的值
      model[v.field] = hasField ? model[v.field] : v.value !== void 0 ? v.value : ''
    }
  })
  return model
}
