const CAPTCHA_MAX_WIDTH = 400
const CAPTCHA_VIEWPORT_GUTTER = 60

export const getCaptchaDimensions = (viewportWidth: number) => {
  const safeViewportWidth =
    Number.isFinite(viewportWidth) && viewportWidth > 0
      ? Math.floor(viewportWidth)
      : CAPTCHA_MAX_WIDTH + CAPTCHA_VIEWPORT_GUTTER
  const width = Math.min(
    CAPTCHA_MAX_WIDTH,
    Math.max(1, safeViewportWidth - CAPTCHA_VIEWPORT_GUTTER)
  )
  const widthValue = `${width}px`

  return {
    barSize: {
      width: widthValue,
      height: '46px'
    },
    imgSize: {
      width: widthValue,
      height: `${Math.round(width / 2)}px`
    }
  }
}
