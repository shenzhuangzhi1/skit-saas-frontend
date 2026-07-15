<template>
  <el-container class="kefu-layout">
    <!-- 会话列表 -->
    <KeFuConversationList ref="keFuConversationRef" @change="handleChange" />
    <!-- 会话详情（选中会话的消息列表） -->
    <KeFuMessageList ref="keFuChatBoxRef" />
    <!-- 会员信息（选中会话的会员信息） -->
    <MemberInfo ref="memberInfoRef" />
  </el-container>
</template>

<script lang="ts" setup>
import { KeFuConversationList, KeFuMessageList, MemberInfo } from './components'
import { WebSocketMessageTypeConstants } from './components/tools/constants'
import { KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { useWebSocket } from '@vueuse/core'
import { useMallKefuStore } from '@/store/modules/mall/kefu'
import { createTicketedWebSocketUrl } from '@/utils/websocketTicket'

defineOptions({ name: 'KeFu' })

const message = useMessage() // 消息弹窗
const kefuStore = useMallKefuStore() // 客服缓存

// ======================= WebSocket start =======================
const server = (import.meta.env.VITE_BASE_URL + '/infra/ws').replace(/^http/, 'ws')
const connectionUrl = ref<string>()
let shouldBeConnected = false
let ticketRequestPending = false
let connectionGeneration = 0
let reconnectTimer: ReturnType<typeof setTimeout> | undefined

/** 发起 WebSocket 连接 */
const { status, data, close, open } = useWebSocket(connectionUrl, {
  immediate: false,
  autoConnect: false,
  autoReconnect: false,
  heartbeat: true,
  onDisconnected: () => scheduleReconnect()
})

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = undefined
  }
}

function scheduleReconnect() {
  if (!shouldBeConnected || reconnectTimer) {
    return
  }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined
    void connectSecurely()
  }, 1000)
}

/** 每次初连和重连都签发新票；签发失败绝不复用 URL 或打开连接。 */
async function connectSecurely() {
  if (
    !shouldBeConnected ||
    ticketRequestPending ||
    status.value === 'OPEN' ||
    status.value === 'CONNECTING'
  ) {
    return
  }
  ticketRequestPending = true
  const generation = ++connectionGeneration
  try {
    const ticketedUrl = await createTicketedWebSocketUrl(server)
    if (!shouldBeConnected || generation !== connectionGeneration) {
      return
    }
    connectionUrl.value = ticketedUrl
    open()
  } catch {
    if (shouldBeConnected && generation === connectionGeneration) {
      message.error('WebSocket 安全票据签发失败')
      scheduleReconnect()
    }
  } finally {
    if (generation === connectionGeneration) {
      ticketRequestPending = false
    }
  }
}

/** 监听 WebSocket 数据 */
watch(
  () => data.value,
  (newData) => {
    if (!newData) return
    try {
      // 1. 收到心跳
      if (newData === 'pong') return

      // 2.1 解析 type 消息类型
      const jsonMessage = JSON.parse(newData)
      const type = jsonMessage.type
      if (!type) {
        message.error('未知的消息类型：' + newData)
        return
      }

      // 2.2 消息类型：KEFU_MESSAGE_TYPE
      if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_TYPE) {
        const message = JSON.parse(jsonMessage.content)
        // 刷新会话列表
        kefuStore.updateConversation(message.conversationId)
        // 刷新消息列表
        keFuChatBoxRef.value?.refreshMessageList(message)
        return
      }

      // 2.3 消息类型：KEFU_MESSAGE_ADMIN_READ
      if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_ADMIN_READ) {
        // 更新会话已读
        const message = JSON.parse(jsonMessage.content)
        kefuStore.updateConversationStatus(message.conversationId)
      }
    } catch (error) {
      console.error(error)
    }
  },
  {
    immediate: false // 不立即执行
  }
)
// ======================= WebSocket end =======================

/** 加载指定会话的消息列表 */
const keFuChatBoxRef = ref<InstanceType<typeof KeFuMessageList>>()
const memberInfoRef = ref<InstanceType<typeof MemberInfo>>()
const handleChange = (conversation: KeFuConversationRespVO) => {
  keFuChatBoxRef.value?.getNewMessageList(conversation)
  memberInfoRef.value?.initHistory(conversation)
}

const keFuConversationRef = ref<InstanceType<typeof KeFuConversationList>>()
/** 初始化 */
onMounted(() => {
  /** 加载会话列表 */
  kefuStore.setConversationList().then(() => {
    keFuConversationRef.value?.calculationLastMessageTime()
  })
  shouldBeConnected = true
  void connectSecurely()
})

/** 销毁 */
onBeforeUnmount(() => {
  shouldBeConnected = false
  connectionGeneration++
  ticketRequestPending = false
  clearReconnectTimer()
  close()
})
</script>

<style lang="scss">
.kefu-layout {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  flex: 1;
}

/* 定义滚动条样式 */
::-webkit-scrollbar {
  width: 10px;
  height: 6px;
}

/* 定义滚动条轨道 内阴影+圆角 */
::-webkit-scrollbar-track {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: inset 0 0 0 rgb(240 240 240 / 50%);
}

/* 定义滑块 内阴影+圆角 */
::-webkit-scrollbar-thumb {
  background-color: rgb(240 240 240 / 50%);
  border-radius: 10px;
  box-shadow: inset 0 0 0 rgb(240 240 240 / 50%);
}
</style>
