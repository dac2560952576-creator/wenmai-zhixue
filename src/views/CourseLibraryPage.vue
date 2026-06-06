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
          <div class="course-thumb" :style="{ background: course.gradient }">
            <img v-if="thumbnails[course.id]" :src="thumbnails[course.id]" referrerpolicy="no-referrer" class="course-cover" @error="e => e.target.hidden = true" />
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

    <!-- 视频播放器（B站嵌入） -->
    <div class="video-overlay" v-if="activeCourse" @click.self="closePlayer">
      <div class="video-card">
        <div class="video-header">
          <h3>{{ activeCourse.title }}</h3>
          <button @click="closePlayer">✕</button>
        </div>
        <div class="video-frame">
          <iframe
            v-if="activeCourse.bvid"
            :src="`//player.bilibili.com/player.html?bvid=${activeCourse.bvid}&page=1&autoplay=0`"
            scrolling="no"
            border="0"
            frameborder="no"
            framespacing="0"
            allowfullscreen="true"
            style="width:100%;height:100%;"
          ></iframe>
          <div v-else class="video-placeholder">
            <span>{{ activeCourse.icon }}</span>
            <p>{{ activeCourse.title }}</p>
            <p class="video-hint">暂无可播放的视频链接</p>
          </div>
        </div>
        <p class="video-desc">{{ activeCourse.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAllCourseViews, incrementCourseViews } from '@/services/db'

const route = useRoute()
const authStore = useAuthStore()
const activeFilter = ref('全部')
const filterTags = ['全部', '龙泉青瓷', '杭州丝绸', '景德镇瓷器', '宜兴紫砂', '苏绣', '景泰蓝', '东阳木雕', '中国剪纸']

const activeCourse = ref(null)
const courseViews = ref(getAllCourseViews())
async function openCourse(c) {
  activeCourse.value = c
  if (authStore.isLoggedIn) courseViews.value = { ...courseViews.value, [c.id]: incrementCourseViews(c.id) }
}

function closePlayer() {
  activeCourse.value = null
}

// ---- 课程信息（从B站API获取封面+真实时长） ----
const thumbnails = ref({})
function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m + ':' + String(s).padStart(2, '0')
}
async function fetchBilibiliMeta() {
  const apiBase = import.meta.env.DEV ? '/api/bilibili' : 'https://api.bilibili.com'
  for (const course of courses.value) {
    if (!course.bvid) continue
    try {
      const res = await fetch(`${apiBase}/x/web-interface/view?bvid=${course.bvid}`)
      if (!res.ok) continue
      const json = await res.json()
      if (json.data?.pic) {
        thumbnails.value[course.id] = json.data.pic
      }
      if (json.data?.duration) {
        course.duration = formatDuration(json.data.duration)
      }
    } catch { /* 获取失败保持兜底值 */ }
  }
}
onMounted(() => {
  // 从学习记录跳转时自动打开指定课程
  const courseId = route.query.open
  if (courseId) {
    const course = courses.value.find(c => c.id === Number(courseId))
    if (course) openCourse(course)
  }
  fetchBilibiliMeta()
})

const courses = ref([
  {
    id: 1, title: '龙泉青瓷入门：从泥到瓷', icon: '🏺', duration: '52:18',
    craft: '龙泉青瓷', tagClass: 'tag-celadon',
    gradient: 'linear-gradient(135deg, #B2DFDB, #80CBC4)',
    bvid: 'BV1kh411r7yU', desc: '青瓷讲堂系列：涵盖龙泉窑历史、粉青/梅子青釉色、哥窑弟窑鉴别、刻划花工艺全解析。'
  },
  {
    id: 2, title: '杭绣技法：双面绣的秘密', icon: '🧵', duration: '5:42',
    craft: '杭州丝绸', tagClass: 'tag-gold',
    gradient: 'linear-gradient(135deg, #F5EDE0, #E2CB94)',
    bvid: 'BV1oj421R7QT', desc: '省级非遗传承人薛氏刺绣揭秘双面绣核心秘诀——系小针无结无线头，正反两面同样精美。'
  },
  {
    id: 3, title: '青瓷纹样中的吉祥寓意', icon: '🖌️', duration: '8:06',
    craft: '龙泉青瓷', tagClass: 'tag-vermilion',
    gradient: 'linear-gradient(135deg, #F8CDD0, #E8B4B8)',
    bvid: 'BV1rb4y1d7nN', desc: '瓷物志：近距离品鉴宋龙泉窑青釉刻莲瓣纹碗，解读莲瓣纹、缠枝纹、回纹的文化含义。'
  },
  {
    id: 4, title: '景德镇青花瓷绘制技法', icon: '🏺', duration: '7:31',
    craft: '景德镇瓷器', tagClass: 'tag-celadon',
    gradient: 'linear-gradient(135deg, #B0C4DE, #87CEEB)',
    bvid: 'BV1VE411D7dz', desc: '《匠心冶陶》纪录片第九集：青花及釉下彩绘——分水技法、勾线点染，完整演示青花绘制全流程。'
  },
  {
    id: 5, title: '苏绣双面绣精讲', icon: '🧵', duration: '12:46',
    craft: '苏绣', tagClass: 'tag-gold',
    gradient: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
    bvid: 'BV1cV411j7B7', desc: '苏绣针法教学系列合集：双面绣兰草、滚针、虚实针、乱针绣等核心针法逐一讲解示范。'
  },
  {
    id: 6, title: '东阳木雕浮雕入门', icon: '🪚', duration: '15:20',
    craft: '东阳木雕', tagClass: 'tag-gold',
    gradient: 'linear-gradient(135deg, #EDE5D8, #D4C4A8)',
    bvid: 'BV1Yh411B7sc', desc: '东阳木雕挂屏《清荷凝香》：樟木独板浅浮雕技法完整演示，涵盖开线条、修光全流程。'
  },
  {
    id: 7, title: '景泰蓝掐丝工艺', icon: '🔔', duration: '8:45',
    craft: '景泰蓝', tagClass: 'tag-celadon',
    gradient: 'linear-gradient(135deg, #F0E6D3, #E2C896)',
    bvid: 'BV16T4y1u7ur', desc: '景泰蓝掐丝珐琅画基础教程：从起稿到掐丝，粘丝、弯丝技法和工具使用全讲解。'
  },
  {
    id: 8, title: '宜兴紫砂壶全手工制作', icon: '🫖', duration: '12:50',
    craft: '宜兴紫砂', tagClass: 'tag-celadon',
    gradient: 'linear-gradient(135deg, #D7CCC8, #BCAAA4)',
    bvid: 'BV1xi8oe6EfN', desc: '老手艺人全手工制作紫砂壶全过程：拍身筒、开壶口、搓嘴把、上嘴把，108道工序一览。'
  },
  {
    id: 9, title: '传统剪纸技法入门', icon: '✂️', duration: '32:15',
    craft: '中国剪纸', tagClass: 'tag-vermilion',
    gradient: 'linear-gradient(135deg, #FFE0B2, #FFCC80)',
    bvid: 'BV1Ky4y1x7kA', desc: '剪纸基础教学全套：折叠法→剪刀使用→剪纸符号训练→阴刻阳刻技法→综合设计。'
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
.course-cover {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
}
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
.video-overlay {
  position: absolute; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-lg);
}
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
