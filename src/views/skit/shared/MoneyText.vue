<template>
  <span class="font-mono tabular-nums">{{ text }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { formatMoneyUnits, formatMoneyUnitsRounded, type MoneyUnits } from './tenantScope'

const props = defineProps<MoneyUnits & { decimals?: number }>()
const text = computed(() =>
  props.decimals != null ? formatMoneyUnitsRounded(props, props.decimals) : formatMoneyUnits(props)
)
</script>
