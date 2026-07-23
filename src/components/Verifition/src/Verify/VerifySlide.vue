<template>
  <div style="position: relative">
    <div
      v-if="type === '2'"
      :style="{ height: parseInt(setSize.imgHeight) + vSpace + 'px' }"
      class="verify-img-out"
    >
      <div :style="{ width: setSize.imgWidth, height: setSize.imgHeight }" class="verify-img-panel">
        <img
          v-if="backImgBase && !imageLoadError"
          :src="'data:image/png;base64,' + backImgBase"
          alt=""
          style="display: block; width: 100%; height: 100%"
          @error="handleImageError"
          @load="handleImageLoad"
        />
        <div v-else class="verify-image-state" role="status">
          <span v-if="isLoading" class="verify-loading-spinner" aria-hidden="true"></span>
          <i v-else class="iconfont icon-close verify-image-state__icon" aria-hidden="true"></i>
          <span>{{ isLoading ? t('captcha.loading') : loadError || t('captcha.loadFailed') }}</span>
          <button v-if="!isLoading" class="verify-retry-button" type="button" @click="refresh">
            <i class="iconfont icon-refresh" aria-hidden="true"></i>
            {{ t('captcha.retry') }}
          </button>
        </div>
        <div v-show="showRefresh" class="verify-refresh" @click="refresh">
          <i class="iconfont icon-refresh"></i>
        </div>
        <transition name="tips">
          <span v-if="tipWords" :class="passFlag ? 'suc-bg' : 'err-bg'" class="verify-tips">
            {{ tipWords }}
          </span>
        </transition>
      </div>
    </div>
    <!-- 公共部分 -->
    <div
      :style="{ width: setSize.imgWidth, height: barSize.height, 'line-height': barSize.height }"
      class="verify-bar-area"
    >
      <span class="verify-msg" v-text="text"></span>
      <div
        :style="{
          width: leftBarWidth !== undefined ? leftBarWidth : barSize.height,
          height: barSize.height,
          'border-color': leftBarBorderColor,
          transition: transitionWidth
        }"
        class="verify-left-bar"
      >
        <span class="verify-msg" v-text="finishText"></span>
        <div
          :style="{
            width: barSize.height,
            height: barSize.height,
            'background-color': moveBlockBackgroundColor,
            left: moveBlockLeft,
            transition: transitionLeft
          }"
          :aria-disabled="!isReady"
          :class="{ 'is-disabled': !isReady, 'is-dragging': status }"
          class="verify-move-block"
          role="slider"
          @mousedown="start"
          @touchstart="start"
        >
          <i :class="['verify-icon iconfont', iconClass]" :style="{ color: iconColor }"></i>
          <div
            v-if="type === '2'"
            :style="{
              width: Math.floor((parseInt(setSize.imgWidth) * 47) / 310) + 'px',
              height: setSize.imgHeight,
              top: '-' + (parseInt(setSize.imgHeight) + vSpace) + 'px',
              'background-size': setSize.imgWidth + ' ' + setSize.imgHeight
            }"
            class="verify-sub-block"
          >
            <img
              v-if="blockBackImgBase"
              :src="'data:image/png;base64,' + blockBackImgBase"
              alt=""
              style="display: block; width: 100%; height: 100%; -webkit-user-drag: none"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup type="text/babel">
/**
 * VerifySlide
 * @description 滑块
 * */
import { aesEncrypt } from './../utils/ase'
import { resetSize } from './../utils/util'
import { getCode, reqCheck } from '@/api/login'

const props = defineProps({
  captchaType: {
    type: String
  },
  type: {
    type: String,
    default: '1'
  },
  //弹出式pop，固定fixed
  mode: {
    type: String,
    default: 'fixed'
  },
  vSpace: {
    type: Number,
    default: 5
  },
  explain: {
    type: String,
    default: ''
  },
  imgSize: {
    type: Object,
    default() {
      return {
        width: '310px',
        height: '155px'
      }
    }
  },
  blockSize: {
    type: Object,
    default() {
      return {
        width: '50px',
        height: '50px'
      }
    }
  },
  barSize: {
    type: Object,
    default() {
      return {
        width: '310px',
        height: '30px'
      }
    }
  }
})

const { t } = useI18n()
const { mode, captchaType, type, blockSize, explain } = toRefs(props)
const { proxy } = getCurrentInstance()
let secretKey = ref(''), //后端返回的ase加密秘钥
  passFlag = ref(''), //是否通过的标识
  backImgBase = ref(''), //验证码背景图片
  blockBackImgBase = ref(''), //验证滑块的背景图片
  backToken = ref(''), //后端返回的唯一token值
  startMoveTime = ref(''), //移动开始的时间
  endMovetime = ref(''), //移动结束的时间
  tipWords = ref(''),
  text = ref(''),
  finishText = ref(''),
  setSize = reactive({
    imgHeight: 0,
    imgWidth: 0,
    barHeight: 0,
    barWidth: 0
  }),
  moveBlockLeft = ref(undefined),
  leftBarWidth = ref(undefined),
  // 移动中样式
  moveBlockBackgroundColor = ref('var(--captcha-handle-bg)'),
  leftBarBorderColor = ref('var(--captcha-border)'),
  iconColor = ref('var(--captcha-icon)'),
  iconClass = ref('icon-right'),
  status = ref(false), //鼠标状态
  isEnd = ref(false), //是够验证完成
  showRefresh = ref(true),
  transitionLeft = ref(''),
  transitionWidth = ref(''),
  startLeft = ref(0),
  isLoading = ref(false),
  loadError = ref(''),
  imageLoaded = ref(false),
  imageLoadError = ref(false)

const isReady = computed(
  () =>
    !isLoading.value &&
    !loadError.value &&
    imageLoaded.value &&
    Boolean(backImgBase.value) &&
    Boolean(blockBackImgBase.value)
)

const barArea = computed(() => {
  return proxy.$el.querySelector('.verify-bar-area')
})
const handleMove = (e) => {
  move(e)
}
const handleEnd = () => {
  end()
}
const removeDragListeners = () => {
  window.removeEventListener('touchmove', handleMove)
  window.removeEventListener('mousemove', handleMove)
  window.removeEventListener('touchend', handleEnd)
  window.removeEventListener('mouseup', handleEnd)
}
const addDragListeners = () => {
  removeDragListeners()
  window.addEventListener('touchmove', handleMove)
  window.addEventListener('mousemove', handleMove)
  window.addEventListener('touchend', handleEnd)
  window.addEventListener('mouseup', handleEnd)
}
const syncSize = () => {
  nextTick(() => {
    if (!proxy.$el) return
    const { imgHeight, imgWidth, barHeight, barWidth } = resetSize(proxy)
    setSize.imgHeight = imgHeight
    setSize.imgWidth = imgWidth
    setSize.barHeight = barHeight
    setSize.barWidth = barWidth
  })
}
const init = () => {
  if (explain.value === '') {
    text.value = t('captcha.slide')
  } else {
    text.value = explain.value
  }
  getPictrue()
  syncSize()
  nextTick(() => proxy.$parent.$emit('ready', proxy))

  addDragListeners()
}
watch(type, () => {
  init()
})
watch(
  () => [props.imgSize.width, props.imgSize.height, props.barSize.width, props.barSize.height],
  syncSize
)
onMounted(() => {
  // 禁止拖拽
  init()
  proxy.$el.onselectstart = function () {
    return false
  }
})
onBeforeUnmount(() => {
  removeDragListeners()
})
//鼠标按下
const start = (e) => {
  if (!isReady.value) return
  e = e || window.event
  if (!e.touches) {
    //兼容PC端
    var x = e.clientX
  } else {
    //兼容移动端
    var x = e.touches[0].pageX
  }
  startLeft.value = Math.floor(x - barArea.value.getBoundingClientRect().left)
  startMoveTime.value = +new Date() //开始滑动的时间
  if (isEnd.value == false) {
    text.value = ''
    moveBlockBackgroundColor.value = 'var(--captcha-primary)'
    leftBarBorderColor.value = 'var(--captcha-primary)'
    iconColor.value = 'var(--skit-active-text)'
    e.stopPropagation()
    status.value = true
  }
}
//鼠标移动
const move = (e) => {
  e = e || window.event
  if (status.value && isEnd.value == false) {
    if (!e.touches) {
      //兼容PC端
      var x = e.clientX
    } else {
      //兼容移动端
      var x = e.touches[0].pageX
    }
    var bar_area_left = barArea.value.getBoundingClientRect().left
    var move_block_left = x - bar_area_left //小方块相对于父元素的left值
    if (
      move_block_left >=
      barArea.value.offsetWidth - parseInt(parseInt(blockSize.value.width) / 2) - 2
    ) {
      move_block_left =
        barArea.value.offsetWidth - parseInt(parseInt(blockSize.value.width) / 2) - 2
    }
    if (move_block_left <= 0) {
      move_block_left = parseInt(parseInt(blockSize.value.width) / 2)
    }
    //拖动后小方块的left值
    moveBlockLeft.value = move_block_left - startLeft.value + 'px'
    leftBarWidth.value = move_block_left - startLeft.value + 'px'
  }
}

//鼠标松开
const end = () => {
  endMovetime.value = +new Date()
  //判断是否重合
  if (status.value && isEnd.value == false) {
    var moveLeftDistance = parseInt((moveBlockLeft.value || '0').replace('px', ''))
    moveLeftDistance = (moveLeftDistance * 310) / parseInt(setSize.imgWidth)
    let data = {
      captchaType: captchaType.value,
      pointJson: secretKey.value
        ? aesEncrypt(JSON.stringify({ x: moveLeftDistance, y: 5.0 }), secretKey.value)
        : JSON.stringify({ x: moveLeftDistance, y: 5.0 }),
      token: backToken.value
    }
    reqCheck(data).then((res) => {
      if (res.repCode == '0000') {
        moveBlockBackgroundColor.value = 'var(--el-color-success)'
        leftBarBorderColor.value = 'var(--el-color-success)'
        iconColor.value = 'var(--skit-active-text)'
        iconClass.value = 'icon-check'
        showRefresh.value = false
        isEnd.value = true
        if (mode.value == 'pop') {
          setTimeout(() => {
            proxy.$parent.clickShow = false
            refresh()
          }, 1500)
        }
        passFlag.value = true
        tipWords.value = `${((endMovetime.value - startMoveTime.value) / 1000).toFixed(2)}s
            ${t('captcha.success')}`
        var captchaVerification = secretKey.value
          ? aesEncrypt(
              backToken.value + '---' + JSON.stringify({ x: moveLeftDistance, y: 5.0 }),
              secretKey.value
            )
          : backToken.value + '---' + JSON.stringify({ x: moveLeftDistance, y: 5.0 })
        setTimeout(() => {
          tipWords.value = ''
          proxy.$parent.closeBox()
          proxy.$parent.$emit('success', { captchaVerification })
        }, 1000)
      } else {
        moveBlockBackgroundColor.value = 'var(--el-color-danger)'
        leftBarBorderColor.value = 'var(--el-color-danger)'
        iconColor.value = 'var(--skit-active-text)'
        iconClass.value = 'icon-close'
        passFlag.value = false
        setTimeout(function () {
          refresh()
        }, 1000)
        proxy.$parent.$emit('error', proxy)
        tipWords.value = t('captcha.fail')
        setTimeout(() => {
          tipWords.value = ''
        }, 1000)
      }
    })
    status.value = false
  }
}

const refresh = async () => {
  showRefresh.value = true
  finishText.value = ''

  transitionLeft.value = 'left .3s'
  moveBlockLeft.value = 0

  leftBarWidth.value = undefined
  transitionWidth.value = 'width .3s'

  leftBarBorderColor.value = 'var(--captcha-border)'
  moveBlockBackgroundColor.value = 'var(--captcha-handle-bg)'
  iconColor.value = 'var(--captcha-icon)'
  iconClass.value = 'icon-right'
  isEnd.value = false
  status.value = false

  await getPictrue()
  setTimeout(() => {
    transitionWidth.value = ''
    transitionLeft.value = ''
    if (!loadError.value) text.value = explain.value || t('captcha.slide')
  }, 300)
}

const handleImageLoad = () => {
  imageLoaded.value = true
  imageLoadError.value = false
  loadError.value = ''
  text.value = explain.value || t('captcha.slide')
}

const handleImageError = () => {
  imageLoaded.value = false
  imageLoadError.value = true
  loadError.value = t('captcha.loadFailed')
  text.value = loadError.value
}

// 请求背景图片和验证图片
const getPictrue = async () => {
  isLoading.value = true
  loadError.value = ''
  imageLoaded.value = false
  imageLoadError.value = false
  backImgBase.value = ''
  blockBackImgBase.value = ''
  text.value = t('captcha.loading')

  try {
    const res = await getCode({ captchaType: captchaType.value })
    const originalImage = res?.repData?.originalImageBase64
    const jigsawImage = res?.repData?.jigsawImageBase64

    if (res?.repCode !== '0000' || !originalImage || !jigsawImage) {
      throw new Error(res?.repMsg || t('captcha.loadFailed'))
    }

    backImgBase.value = originalImage
    blockBackImgBase.value = jigsawImage
    backToken.value = res.repData.token
    secretKey.value = res.repData.secretKey
  } catch {
    loadError.value = t('captcha.loadFailed')
    text.value = loadError.value
  } finally {
    isLoading.value = false
  }
}
</script>
