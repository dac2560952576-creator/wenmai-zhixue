/**
 * 从视频文件提取第一帧作为缩略图
 * @param {string} videoUrl - 视频路径
 * @returns {Promise<string|null>} base64 data URL 或 null
 */
export function getVideoThumbnail(videoUrl) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    video.muted = true
    video.src = videoUrl

    const cleanup = () => {
      video.remove()
    }

    const capture = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      } catch {
        resolve(null)
      }
      cleanup()
    }

    video.onloadeddata = () => {
      video.currentTime = 0.5
    }

    video.onseeked = capture
    video.onerror = () => {
      resolve(null)
      cleanup()
    }

    // 超时回退
    setTimeout(() => {
      resolve(null)
      cleanup()
    }, 5000)
  })
}
