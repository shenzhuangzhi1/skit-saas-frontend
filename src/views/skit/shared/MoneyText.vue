<template>
  <span class="font-mono tabular-nums">{{ text }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { formatMoneyUnits, type MoneyUnits } from './tenantScope'

const props = defineProps<MoneyUnits>()
const text = computed(() => formatMoneyUnits(props))
</script>
