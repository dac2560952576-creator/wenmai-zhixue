<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">课程视频库</h1>
      <span></span>
    </header>

    <div class="page-body">
      <!-- 分类标签 -->
      <div class="filter-row">
        <span v-for="tag in filterTags" :key="tag" class="filter-tag" :class="{ active: activeFilter === tag }" @click="activeFilter = tag">{{ tag }}</span>
      </div>

      <!-- 课程列表 -->
      <div class="course-grid">
        <div v-for="course in filteredCourses" :key="course.id" class="course-card" @click="openCourse(course)">
          <div
            class="course-thumb"
            :style="thumbnails[course.id] ? { backgroundImage: 'url(' + thumbnails[course.id] + ')', backgroundSize: 'cover', backgroundPosition: 'center' } : { background: course.gradient }"
          >
            <span v-if="!thumbnails[course.id]" class="course-icon">{{ course.icon }}</span>
            <span class="duration">{{ course.duration }}</span>
          </div>
          <div class="course-info">
            <h4>{{ course.title }}</h4>
            <div class="course-meta">
              <span class="tag" :class="course.tagClass">{{ course.craft }}</span>
              <span>{{ courseViews[course.id] || 0 }} 已学</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!filteredCourses.length" class="empty-state">
        <span class="icon">📹</span>
        <span class="text">暂无课程</span>
      </div>
    </div>

    <!-- 视频播放器 -->
    <div class="video-overlay" v-if="activeCourse" :class="{ fullscreen: isFullscreen }" @click.self="closePlayer">
      <div class="video-card" :class="{ fullscreen: isFullscreen }">
        <div class="video-header" v-show="!isFullscreen">
          <h3>{{ activeCourse.title }}</h3>
          <button @click="closePlayer">✕</button>
        </div>
        <div class="video-frame" ref="videoFrameRef">
          <video
            v-if="activeCourse.videoUrl"
            ref="videoRef"
            :src="activeCourse.videoUrl"
            controls
            controlslist="nodownload"
            playsinline
            @dblclick.prevent="toggleFullscreen"
            @timeupdate="onTimeUpdate"
            style="width:100%;height:100%;object-fit:contain"
          ></video>
          <div v-else class="video-placeholder">
            <span>{{ activeCourse.icon }}</span>
            <p>视频源：{{ activeCourse.title }}</p>
            <p class="video-hint">将 MP4 文件放入 public/videos/ 目录</p>
          </div>
        </div>
        <p class="video-desc" v-show="!isFullscreen">{{ activeCourse.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getVideoThumbnail } from '@/services/videoThumbnail'
import { getAllCourseViews, incrementCourseViews, saveVideoPosition, getVideoPosition } from '@/services/db'

const route = useRoute()
const authStore = useAuthStore()
const activeFilter = ref('全部')
const filterTags = ['全部', '龙泉青瓷', '杭州丝绸', '景德镇瓷器', '宜兴紫砂', '苏绣', '景泰蓝', '东阳木雕', '中国剪纸']

const activeCourse = ref(null)
const courseViews = ref(getAllCourseViews())
async function openCourse(c) {
  activeCourse.value = c
  if (authStore.isLoggedIn) courseViews.value = { ...courseViews.value, [c.id]: incrementCourseViews(c.id) }
  await nextTick()
  const savedPos = getVideoPosition(c.id)
  if (savedPos > 0 && videoRef.value) {
    videoRef.value.currentTime = savedPos
  }
}

// ---- 全屏播放 ----
const videoRef = ref(null)
const videoFrameRef = ref(null)
const isFullscreen = ref(false)

function toggleFullscreen() {
  const el = videoFrameRef.value
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen()
  }
}

function closePlayer() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
  if (activeCourse.value && videoRef.value) {
    saveVideoPosition(activeCourse.value.id, videoRef.value.currentTime)
  }
  activeCourse.value = null
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

let _lastSaveTime = 0
function onTimeUpdate() {
  if (!activeCourse.value || !videoRef.value) return
  const now = Date.now()
  if (now - _lastSaveTime < 5000) return
  _lastSaveTime = now
  saveVideoPosition(activeCourse.value.id, videoRef.value.currentTime)
}

// ---- 视频缩略图 & 观看次数 ----
const thumbnails = ref({})
onMounted(async () => {
  document.addEventListener('fullscreenchange', onFullscreenChange)

  // 从学习记录跳转时自动打开指定课程
  const courseId = route.query.open
  if (courseId) {
    const course = courses.value.find(c => c.id === Number(courseId))
    if (course) openCourse(course)
  }
  for (const course of courses.value) {
    if (course.videoUrl) {
      const thumb = await getVideoThumbnail(course.videoUrl)
      if (thumb) thumbnails.value[course.id] = thumb
    }
  }
})

const courses = ref([
  {
    id: 1, title: '龙泉青瓷入门：从泥到瓷', icon: '🏺', duration: '8:31',
    craft: '龙泉青瓷', tagClass: 'tag-celadon',
    gradient: 'linear-gradient(135deg, #B2DFDB, #80CBC4)',
    videoUrl: '/videos/longquan-qingci.mp4', desc: '从选泥、拉坯到上釉、烧窑，完整演示龙泉青瓷制作全过程。'
  },
  {
    id: 2, title: '杭绣技法：双面绣的秘密', icon: '🧵', duration: '2:39',
    craft: '杭州丝绸', tagClass: 'tag-gold',
    gradient: 'linear-gradient(135deg, #F5EDE0, #E2CB94)',
    videoUrl: '/videos/hangzhoucixiu.mp4', desc: '杭州刺绣代表性技法双面绣的详细教程，从起针到收针全流程。'
  },
  {
    id: 3, title: '青瓷纹样中的吉祥寓意', icon: '🖌️', duration: '15:20',
    craft: '龙泉青瓷', tagClass: 'tag-vermilion',
    gradient: 'linear-gradient(135deg, #F8CDD0, #E8B4B8)',
    videoUrl: '', desc: '解读龙泉青瓷常见纹样——莲瓣纹、缠枝纹、回纹等的文化含义。'
  },
  {
    id: 4, title: '景德镇青花瓷绘制技法', icon: '🏺', duration: '22:10',
    craft: '景德镇瓷器', tagClass: 'tag-celadon',
    gradient: 'linear-gradient(135deg, #B0C4DE, #87CEEB)',
    videoUrl: '', desc: '从勾线到分水，完整学习景德镇青花瓷传统绘制技法。'
  },
  {
    id: 5, title: '苏绣双面绣精讲', icon: '🧵', duration: '18:30',
    craft: '苏绣', tagClass: 'tag-gold',
    gradient: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
    videoUrl: '', desc: '苏绣大师教你双面绣的核心针法，正反两面完美呈现。'
  },
  {
    id: 6, title: '东阳木雕浮雕入门', icon: '🪚', duration: '25:45',
    craft: '东阳木雕', tagClass: 'tag-gold',
    gradient: 'linear-gradient(135deg, #EDE5D8, #D4C4A8)',
    videoUrl: '', desc: '从选材到雕刻，系统学习东阳木雕平面浮雕的基础技法。'
  },
  {
    id: 7, title: '景泰蓝掐丝工艺', icon: '🔔', duration: '20:15',
    craft: '景泰蓝', tagClass: 'tag-celadon',
    gradient: 'linear-gradient(135deg, #F0E6D3, #E2C896)',
    videoUrl: '', desc: '景泰蓝制作中最关键的掐丝环节，弯丝、焊丝全流程。'
  },
  {
    id: 8, title: '宜兴紫砂壶全手工制作', icon: '🫖', duration: '28:50',
    craft: '宜兴紫砂', tagClass: 'tag-celadon',
    gradient: 'linear-gradient(135deg, #D7CCC8, #BCAAA4)',
    videoUrl: '', desc: '拍身筒、镶身筒技法，从泥片到成壶完整的紫砂制作工艺。'
  },
  {
    id: 9, title: '传统剪纸技法入门', icon: '✂️', duration: '10:15',
    craft: '中国剪纸', tagClass: 'tag-vermilion',
    gradient: 'linear-gradient(135deg, #FFE0B2, #FFCC80)',
    videoUrl: '', desc: '阴刻阳刻基础刀法，从简单纹样到复杂图案的剪纸教学。'
  }
])

const filteredCourses = computed(() => {
  if (activeFilter.value === '全部') return courses.value
  return courses.value.filter(c => c.craft === activeFilter.value)
})
</script>

<style scoped>
/* 分类筛选 */
.filter-row {
  display: flex; gap: var(--space-sm); padding: var(--space-sm) 0 16px;
  overflow-x: auto; -webkit-overflow-scrolling: touch;
}
.filter-row::-webkit-scrollbar { display: none; }
.filter-tag {
  padding: 6px 16px; border-radius: var(--radius-full); font-size: 13px;
  background: var(--card-bg); color: var(--ink-mid);
  white-space: nowrap; cursor: pointer; transition: all 0.2s;
  border: 1px solid var(--border-color);
}
.filter-tag.active {
  background: var(--celadon-dark); color: #FFF;
  border-color: var(--celadon-dark);
}

/* 课程网格 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}
.course-card {
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid rgba(0,0,0,0.04);
  cursor: pointer;
  transition: transform 0.15s;
}
.course-card:active { transform: scale(0.98); }
.course-thumb {
  height: 100px; position: relative;
  display: flex; align-items: center; justify-content: center;
  background: var(--paper-warm);
}
.course-icon { font-size: 36px; }
.duration {
  position: absolute; bottom: 4px; right: 4px;
  background: rgba(0,0,0,0.55); color: #FFF;
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
  font-weight: 500;
}
.course-info { padding: 10px 12px; }
.course-info h4 { font-size: 13px; font-weight: 600; color: var(--ink-dark); line-height: 1.35; }
.course-meta {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 6px;
}
.course-meta span { font-size: 11px; color: var(--ink-light); }

/* 视频播放器 */
.video-overlay.fullscreen { background: #000; padding: 0; }
.video-overlay {
  position: absolute; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-lg);
}
.video-card.fullscreen { max-width: none; border-radius: 0; background: #000; }
.video-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  width: 100%;
  max-width: 480px;
}
.video-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
}
.video-header h3 { font-size: 15px; font-weight: 600; }
.video-header-actions { display: flex; gap: 8px; align-items: center; }
.video-header button,
.fullscreen-btn {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: var(--paper-warm); font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.video-frame {
  aspect-ratio: 16/9; background: #000; width: 100%;
}
.video-card.fullscreen .video-frame { aspect-ratio: auto; height: 100vh; }
.video-placeholder {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: #FFF;
}
.video-placeholder span { font-size: 48px; }
.video-placeholder p { font-size: 14px; margin-top: 8px; }
.video-hint { font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 4px; }
.video-desc {
  padding: 12px 16px;
  font-size: 13px; color: var(--ink-mid); line-height: 1.6;
}

.empty-state {
  text-align: center; padding: 60px 20px; color: var(--ink-light);
}
.empty-state .icon { font-size: 40px; display: block; margin-bottom: 8px; }
.empty-state .text { font-size: 14px; }
</style>
