<template>
  <ul class="m-0 list-none p-0">
    <li v-for="node in nodes" :key="node.memberId" class="mb-8px">
      <div class="flex flex-wrap items-center gap-8px rounded border p-10px">
        <button
          class="cursor-pointer border-0 bg-transparent p-0 text-left"
          @click="$emit('select', node.memberId)"
        >
          <span class="font-600">{{ node.displayName }}</span>
          <span class="ml-6px text-12px text-[var(--el-text-color-secondary)]">
            #{{ node.memberId }}
          </span>
        </button>
        <el-tag size="small">直属 {{ node.directChildCount || 0 }}</el-tag>
        <el-button
          v-if="canLoad(node)"
          :loading="node.loading"
          link
          type="primary"
          @click="$emit('load-children', node.memberId, node.nextCursor)"
        >
          {{ node.loaded ? '加载更多' : '加载直属成员' }}
        </el-button>
      </div>
      <MemberTree
        v-if="node.children.length"
        class="ml-24px mt-8px"
        :nodes="node.children"
        @load-children="forwardLoad"
        @select="(memberId) => $emit('select', memberId)"
      />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { MemberTreeBranch } from './workspaceModel'

defineOptions({ name: 'SkitMemberTree' })
defineProps<{ nodes: MemberTreeBranch[] }>()
const emit = defineEmits<{
  'load-children': [memberId: number, cursor?: string]
  select: [memberId: number]
}>()

const canLoad = (node: MemberTreeBranch) =>
  !node.loaded || Boolean(node.nextCursor) || node.children.length < (node.directChildCount || 0)

const forwardLoad = (memberId: number, cursor?: string) => emit('load-children', memberId, cursor)
</script>
