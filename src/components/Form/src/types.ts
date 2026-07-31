import { FormSchema } from '@/types/form'

export interface PlaceholderModel {
  placeholder?: string
}

export type FormProps = {
  schema?: FormSchema[]
  isCol?: boolean
  model?: Recordable
  autoSetPlaceholder?: boolean
  isCustom?: boolean
  labelWidth?: string | number
} & Recordable
