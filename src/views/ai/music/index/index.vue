<template>
  <ContentWrap>
    <el-empty description="音乐生成服务尚未接入真实接口">
      <p class="text-14px text-[var(--el-text-color-secondary)]">
        当前页面不会生成或展示示例歌曲。接入真实生成与查询接口后再开放使用。
      </p>
    </el-empty>
  </ContentWrap>
</template>

<script lang="ts" setup>
defineOptions({ name: 'AiMusicCreateUnavailable' })
</script>
