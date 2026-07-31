import type { Component } from 'vue'
import { ElInput, ElInputNumber } from 'element-plus'
const componentMap: Record<string, Component> = {
  Input: ElInput,
  InputNumber: ElInputNumber
}

export { componentMap }
