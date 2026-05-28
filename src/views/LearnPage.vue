<template>
  <div class="page">
    <div class="page-body" style="padding-top:8px;">
      <!-- 顶部标题 -->
      <div class="home-title">
        <div>
          <h2 class="home-app-name">文脉智学</h2>
          <p class="home-sub">探索传统手工艺的数字之旅</p>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input
          ref="searchInputRef"
          v-model="keyword"
          placeholder="搜索手工艺门类、技法、术语..."
          class="search-input"
          @input="onSearch"
          @focus="showSearch = true"
          @blur="hideSearch"
          @keyup.enter="doSearch"
        />
        <span v-if="keyword" class="search-clear" @click="keyword = ''; showSearch = false">✕</span>
        <button class="search-btn" @click="doSearch">搜索</button>
      </div>

      <!-- 搜索历史 -->
      <div v-if="showSearch && !keyword" class="search-history">
        <div class="history-head" v-if="searchHistory.length">
          <span class="history-title">搜索历史</span>
          <button class="history-clear-all" @click="clearAllHistory">🗑️ 清空</button>
        </div>
        <div v-for="(h, i) in searchHistory" :key="i" class="history-item">
          <span class="history-text" @click="keyword = h; onSearch()">{{ h }}</span>
          <button class="history-del" @click="removeHistory(i)">✕</button>
        </div>
        <div v-if="!searchHistory.length" class="history-empty">暂无搜索历史</div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="showSearch && keyword" class="search-results">
        <div class="search-count">找到 {{ searchResults.length }} 项</div>
        <div
          v-for="item in searchResults"
          :key="item.type + '-' + item.id"
          class="search-item"
          @click="item.type === 'course' ? (openCourse(item), showSearch = false) : ($router.push('/craft/' + item.id), showSearch = false)"
        >
          <span class="search-item-name">{{ item.name || item.title }}</span>
          <span :class="['search-item-tag', item.type === 'course' ? 'tag-course' : 'tag-doc']">
            {{ item.type === 'course' ? '课程' : '文档' }}
          </span>
          <span class="search-item-region">{{ item.region || item.craft }}</span>
        </div>
        <div v-if="!searchResults.length" class="empty-state" style="padding:20px;">
          <span class="text">未找到相关结果</span>
        </div>
      </div>

      <!-- 非搜索状态 -->
      <template v-if="!showSearch || !keyword">
        <!-- Hero Banner 轮播 -->
        <div class="home-hero" @touchstart="pauseHero" @touchend="resumeHero">
          <div
            class="hero-slides"
            :class="{ 'no-transition': !heroTransition }"
            :style="{ transform: `translateX(-${heroTrack * 100}%)` }"
          >
            <div v-for="(hs, i) in loopSlides" :key="i" class="hero-slide" :style="{ background: hs.bg }">
              <span class="hero-icon">{{ hs.icon }}</span>
              <div class="home-hero-content">
                <h2>{{ hs.title }}</h2>
                <p>{{ hs.sub }}</p>
              </div>
            </div>
          </div>
          <div class="hero-dots">
            <span
              v-for="(hs, i) in heroSlides"
              :key="i"
              :class="['hero-dot', { active: heroReal === i }]"
              @click="goToSlide(i)"
            ></span>
          </div>
        </div>

        <!-- 金刚区 -->
        <div class="quick-entry">
          <div class="quick-item" v-for="craft in featuredCrafts" :key="craft.id" @click="$router.push('/craft/' + craft.id)">
            <div class="quick-icon" :class="craft.id === 'longquan' ? 'learn' : 'silk'">
              {{ craft.id === 'longquan' ? '🏺' : '🧵' }}
            </div>
            <span>{{ craft.name }}</span>
          </div>
          <div class="quick-item" @click="$router.push('/practice')">
            <div class="quick-icon practice">✏️</div>
            <span>AI问答</span>
          </div>
          <div class="quick-item" @click="$router.push('/create')">
            <div class="quick-icon create">🎨</div>
            <span>纹样工坊</span>
          </div>
        </div>

        <!-- 推荐课程 -->
        <div class="section-title">
          <h3>📹 推荐课程</h3>
          <span class="more" @click="$router.push('/courses')" style="cursor:pointer;">更多 ›</span>
        </div>
        <div class="course-carousel">
          <button class="carousel-arrow carousel-left" @click="scrollCourses(-1)" :class="{ disabled: coursePage <= 0 }">‹</button>
          <div class="course-track" ref="courseTrackRef">
            <div class="course-card" v-for="course in courses" :key="course.id" @click="openCourse(course)">
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
          <button class="carousel-arrow carousel-right" @click="scrollCourses(1)" :class="{ disabled: coursePage >= maxCoursePage }">›</button>
        </div>

        <!-- 知识文档 -->
        <div class="section-title">
          <h3>📖 知识文档</h3>
          <span class="more" @click="$router.push('/crafts')" style="cursor:pointer;">更多 ›</span>
        </div>
        <div class="doc-list">
          <div
            v-for="doc in knowledgeDocs" :key="doc.craft.id"
            class="doc-item" @click="$router.push('/craft/' + doc.craft.id)"
          >
            <div class="doc-icon" :class="doc.iconClass">{{ doc.icon }}</div>
            <div class="doc-body">
              <h4>{{ doc.craft.name }} · 完整知识文档</h4>
              <p>{{ doc.sectionSummary }}</p>
            </div>
          </div>
        </div>

      </template>

    </div>

    <!-- 课程视频播放器 -->
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import craftsData from '@/data/工艺知识库.json'
import { getVideoThumbnail } from '@/services/videoThumbnail'
import { getAllCourseViews, incrementCourseViews, trackActiveDay, saveVideoPosition, getVideoPosition } from '@/services/db'

const authStore = useAuthStore()

// ---- 推荐课程 ----
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
    id: 5, title: '苏绣双面绣针法精讲', icon: '🧵', duration: '18:30',
    craft: '苏绣', tagClass: 'tag-gold',
    gradient: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
    videoUrl: '', desc: '苏绣大师亲授双面绣核心针法，正反两面完美呈现。'
  },
  {
    id: 6, title: '东阳木雕浮雕入门', icon: '🪚', duration: '25:45',
    craft: '东阳木雕', tagClass: 'tag-gold',
    gradient: 'linear-gradient(135deg, #EDE5D8, #D4C4A8)',
    videoUrl: '', desc: '从选材到雕刻，系统学习东阳木雕平面浮雕基础技法。'
  }
])
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

let _learnLastSaveTime = 0
function onTimeUpdate() {
  if (!activeCourse.value || !videoRef.value) return
  const now = Date.now()
  if (now - _learnLastSaveTime < 5000) return
  _learnLastSaveTime = now
  saveVideoPosition(activeCourse.value.id, videoRef.value.currentTime)
}

// ---- 视频缩略图 ----
const thumbnails = ref({})
onMounted(async () => {
  startHeroTimer()
  if (authStore.isLoggedIn) trackActiveDay()
  document.addEventListener('fullscreenchange', onFullscreenChange)
  for (const course of courses.value) {
    if (course.videoUrl) {
      const thumb = await getVideoThumbnail(course.videoUrl)
      if (thumb) thumbnails.value[course.id] = thumb
    }
  }
})

onUnmounted(() => {
  clearInterval(heroTimer)
})

// ---- 课程走马灯 ----
const courseTrackRef = ref(null)
const coursePage = ref(0)
const cardsPerPage = 3
const maxCoursePage = computed(() => Math.max(0, Math.ceil(courses.value.length / cardsPerPage) - 1))

function scrollCourses(dir) {
  const next = coursePage.value + dir
  if (next < 0 || next > maxCoursePage.value) return
  coursePage.value = next
  if (courseTrackRef.value) {
    const cardWidth = courseTrackRef.value.querySelector('.course-card')?.offsetWidth || 0
    const gap = 8
    courseTrackRef.value.scrollTo({ left: next * (cardWidth + gap) * cardsPerPage, behavior: 'smooth' })
  }
}

// ---- 基础数据 ----
const keyword = ref('')
const showSearch = ref(false)

// Hero 轮播（无缝循环）
const heroSlides = [
  { title: '龙泉青瓷 · 粉青釉', sub: '探秘千年瓷都的匠心传承', icon: '🏺', bg: 'linear-gradient(160deg, #899E8A 0%, #6B8A7A 25%, #5A7A6A 50%, #4A6B5A 75%, #3D5D4A 100%)' },
  { title: '杭州丝绸 · 杭绣', sub: '一针一线，织就江南风雅', icon: '🧵', bg: 'linear-gradient(160deg, #B8A88A 0%, #A0926E 30%, #8B7B5A 60%, #6D5E42 100%)' },
  { title: '景德镇瓷器 · 青花', sub: '白釉青花，火中淬炼的艺术', icon: '🫙', bg: 'linear-gradient(160deg, #7B8FA8 0%, #5A7290 30%, #446088 60%, #2E4A70 100%)' },
  { title: '东阳木雕 · 浮雕', sub: '刀下生花，木上春秋', icon: '🪚', bg: 'linear-gradient(160deg, #A0856B 0%, #8B6F52 30%, #70563D 60%, #554028 100%)' },
  { title: '苏绣 · 双面绣', sub: '针尖上的东方美学', icon: '🪡', bg: 'linear-gradient(160deg, #B87A8A 0%, #9B5D6E 30%, #7D4255 50%, #5E2E3E 100%)' }
]
const N = heroSlides.length
// 渲染数组：[clone of last, 0,1,2,3,4, clone of first]
const loopSlides = [heroSlides[N - 1], ...heroSlides, heroSlides[0]]
const heroTrack = ref(1)      // translateX 位置，初始在 index=1（真正第0张）
const heroReal = ref(0)       // 实际显示的索引（0~4），给圆点用
const heroTransition = ref(true)
let heroTimer = null

function goToSlide(i) {
  heroReal.value = i
  heroTrack.value = i + 1
  heroTransition.value = true
  resetHeroTimer()
}

function slideNext() {
  heroTrack.value++
  heroTransition.value = true
  heroReal.value = (heroReal.value + 1) % N
  // 走到 clone of first 时，瞬跳回真正的第一张
  if (heroTrack.value === N + 1) {
    setTimeout(() => {
      heroTransition.value = false
      heroTrack.value = 1
    }, 550)
  }
}

function startHeroTimer() {
  heroTimer = setInterval(slideNext, 4000)
}
function resetHeroTimer() {
  clearInterval(heroTimer)
  startHeroTimer()
}
function pauseHero() { clearInterval(heroTimer) }
function resumeHero() { startHeroTimer() }

const featuredCrafts = computed(() => {
  const result = []
  for (const cat of craftsData) {
    for (const item of cat.items) {
      if (item.featured) result.push({ ...item, category: cat.category })
    }
  }
  return result
})

// ---- 搜索历史 ----
const HISTORY_KEY = 'wenmai_search_history'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
const searchHistory = ref(loadHistory())

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory.value))
}

function addToHistory(kw) {
  const kw2 = kw.trim()
  if (!kw2) return
  searchHistory.value = searchHistory.value.filter(h => h !== kw2)
  searchHistory.value.unshift(kw2)
  if (searchHistory.value.length > 20) searchHistory.value.pop()
  saveHistory()
}

function removeHistory(i) {
  searchHistory.value.splice(i, 1)
  saveHistory()
}

function clearAllHistory() {
  searchHistory.value = []
  saveHistory()
}

// ---- 搜索 ----
const searchInputRef = ref(null)
const searchResults = ref([])

function doSearch() {
  showSearch.value = true
  searchInputRef.value?.focus()
  onSearch()
}

function hideSearch() {
  setTimeout(() => {
    if (!keyword.value) showSearch.value = false
  }, 150)
}

function onSearch() {
  const kw = keyword.value.trim()
  if (!kw) { searchResults.value = []; return }
  addToHistory(kw)
  const kwLower = kw.toLowerCase()
  const results = []

  // 搜索知识文档
  for (const cat of craftsData) {
    for (const item of cat.items) {
      let score = 0
      if (item.name.toLowerCase().includes(kwLower)) score += 100
      if (item.region.toLowerCase().includes(kwLower)) score += 50
      for (const tag of item.tags) { if (tag.toLowerCase().includes(kwLower)) score += 30 }
      if (item.brief.toLowerCase().includes(kwLower)) score += 10
      if (cat.category.toLowerCase().includes(kwLower)) score += 20
      if (score > 0) results.push({ ...item, category: cat.category, score, type: 'doc' })
    }
  }

  // 搜索课程视频
  for (const course of courses.value) {
    let score = 0
    if (course.title.toLowerCase().includes(kwLower)) score += 100
    if (course.craft.toLowerCase().includes(kwLower)) score += 60
    if (course.desc?.toLowerCase().includes(kwLower)) score += 20
    if (score > 0) results.push({ ...course, score, type: 'course' })
  }

  results.sort((a, b) => b.score - a.score)
  searchResults.value = results
}

// ====== 知识文档列表 ======
const catMap = {
  '龙泉青瓷': ['celadon', '🏺'], '杭州丝绸': ['silk', '🧵'],
  '景德镇瓷器': ['celadon', '🏺'], '苏绣': ['silk', '🧵'],
  '东阳木雕': ['carve', '🪚'], '景泰蓝': ['metal', '🔔']
}
const fallbackSections = {
  '龙泉青瓷': '基础介绍 · 核心术语表 · 工艺流程 · 典型纹样',
  '杭州丝绸': '基础介绍 · 核心术语表 · 工艺特色 · 典型纹样',
  '景德镇瓷器': '基础介绍 · 青花瓷 · 粉彩 · 颜色釉',
  '苏绣': '基础介绍 · 双面绣 · 乱针绣 · 仿真绣',
  '东阳木雕': '基础介绍 · 浮雕技法 · 建筑装饰 · 家具雕刻',
  '景泰蓝': '基础介绍 · 掐丝 · 点蓝 · 烧蓝 · 打磨'
}
const docDefs = [
  { name: '龙泉青瓷', fullDoc: true },
  { name: '杭州丝绸', fullDoc: true },
  { name: '景德镇瓷器', fullDoc: false },
  { name: '苏绣', fullDoc: false },
  { name: '东阳木雕', fullDoc: false },
  { name: '景泰蓝', fullDoc: false }
]

function findCraftByName(name) {
  for (const cat of craftsData) {
    for (const item of cat.items) { if (item.name === name) return item }
  }
  return null
}

const knowledgeDocs = docDefs.map(({ name, fullDoc }) => {
  const craft = findCraftByName(name)
  const [iconClass, icon] = catMap[name] || ['celadon', '📖']
  return { craft: { ...craft, fullDoc }, iconClass, icon, sectionSummary: fallbackSections[name] || '' }
})
</script>

<style scoped>
/* ====== 顶部标题 ====== */
.home-title {
  padding: 0 0 2px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}
.home-app-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--ink-dark);
  letter-spacing: 0.5px;
}
.home-sub {
  font-size: 12px;
  color: var(--ink-light);
  margin-top: 2px;
}

/* ====== Hero ====== */
.home-hero {
  margin-bottom: var(--space-lg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  height: 148px;
}
.home-hero::before {
  content: '';
  position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background:
    radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.25) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 40%);
}
.hero-slides {
  display: flex; height: 100%;
  transition: transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.hero-slides.no-transition { transition: none; }
.hero-slide {
  min-width: 100%; height: 100%; position: relative;
}
.home-hero-content {
  position: absolute;
  bottom: 20px; left: 20px; right: 20px;
  z-index: 1; color: #FFF;
}
.home-hero-content h2 {
  font-size: 22px; font-weight: 700; letter-spacing: 2px;
  font-family: 'Noto Serif SC', serif;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.home-hero-content p {
  font-size: 13px; opacity: 0.8; margin-top: 4px;
  letter-spacing: 1px; font-family: 'Noto Serif SC', serif;
}
.hero-icon {
  position: absolute; top: 8px; right: 12px; z-index: 0;
  font-size: 72px; opacity: 0.14; transform: rotate(10deg);
  pointer-events: none; line-height: 1;
}
.hero-dots {
  position: absolute; bottom: 10px; right: 16px; z-index: 2;
  display: flex; gap: 6px;
}
.hero-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.4); cursor: pointer;
  transition: all 0.3s;
}
.hero-dot.active {
  background: #FFF; width: 18px; border-radius: 3px;
}

/* ====== 搜索 ====== */
.search-bar {
  margin-bottom: var(--space-lg);
  background: var(--card-bg);
  border-radius: var(--radius-full);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-color);
  transition: border-color 0.2s;
}
.search-bar:focus-within { border-color: var(--celadon); }
.search-icon { font-size: 14px; flex-shrink: 0; }
.search-input { flex: 1; border: none; outline: none; font-size: 14px; background: transparent; color: var(--ink-dark); }
.search-input::placeholder { color: var(--ink-disabled); }
.search-clear {
  font-size: 14px; color: var(--ink-light); cursor: pointer;
  width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
}
.search-btn {
  font-size: 12px; border: none; cursor: pointer; padding: 6px 14px; flex-shrink: 0;
  background: var(--celadon-dark); color: #FFF;
  border-radius: var(--radius-full); font-weight: 600;
}

/* 搜索历史 */
.search-history {
  background: var(--card-bg); border-radius: var(--radius-md);
  overflow: hidden; margin-bottom: var(--space-lg); border: 1px solid var(--border-color);
  padding: 8px 0;
}
.history-head { display: flex; justify-content: space-between; align-items: center; padding: 4px 14px 8px; }
.history-title { font-size: 12px; color: var(--ink-light); }
.history-clear-all { font-size: 12px; border: none; background: none; color: var(--ink-light); cursor: pointer; }
.history-item { display: flex; align-items: center; padding: 0 14px; }
.history-text {
  flex: 1; font-size: 14px; color: var(--ink-dark); padding: 10px 0; cursor: pointer;
}
.history-del {
  font-size: 14px; color: var(--ink-light); border: none; background: none;
  cursor: pointer; padding: 4px; flex-shrink: 0;
}
.history-empty { text-align: center; padding: 24px; font-size: 13px; color: var(--ink-light); }

/* 搜索结果 */
.search-results {
  background: var(--card-bg); border-radius: var(--radius-md);
  overflow: hidden; margin-bottom: var(--space-lg); border: 1px solid var(--border-color);
}
.search-count { padding: 8px 14px; font-size: 12px; color: var(--ink-light); border-bottom: 1px solid var(--border-color); }
.search-item {
  display: flex; align-items: center; gap: 8px; padding: 12px 14px;
  cursor: pointer; border-bottom: 1px solid var(--border-color);
  transition: background 0.15s;
}
.search-item:active { background: var(--paper-warm); }
.search-item:last-child { border-bottom: none; }
.search-item-name { font-size: 14px; font-weight: 600; flex-shrink: 0; }
.search-item-tag {
  font-size: 11px; padding: 2px 8px; border-radius: var(--radius-full); flex-shrink: 0;
}
.search-item-tag.tag-course { background: #E8F3ED; color: #4A8B7A; }
.search-item-tag.tag-doc { background: #FDF3E0; color: #B8860B; }
.search-item-region { font-size: 12px; color: var(--ink-light); margin-left: auto; flex-shrink: 0; }

/* ====== 金刚区 ====== */
.quick-entry {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}
.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 0;
  border-radius: var(--radius-md);
  background: var(--card-bg);
  border: 1px solid rgba(0,0,0,0.03);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.quick-item:active { transform: scale(0.96); }
.quick-icon {
  width: 44px; height: 44px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.quick-icon.learn { background: linear-gradient(135deg, #E8F3ED, #C8E6D4); }
.quick-icon.silk { background: linear-gradient(135deg, #FDF3E0, #E8D5A3); }
.quick-icon.practice { background: linear-gradient(135deg, #FFF3E0, #FFE0B2); }
.quick-icon.create { background: linear-gradient(135deg, #FCEAE9, #F8CDD0); }
.quick-item span { font-size: 11px; color: var(--ink-mid); font-weight: 500; }

/* ====== 课程走马灯 ====== */
.course-carousel {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.course-track {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  flex: 1;
}
.course-track::-webkit-scrollbar { display: none; }
.course-card {
  min-width: calc((100% - 20px) / 3);
  max-width: calc((100% - 20px) / 3);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid rgba(139,119,90,0.12);
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  scroll-snap-align: start;
}
.course-card:active { transform: scale(0.97); }
.course-thumb {
  height: 80px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper-warm);
}
.course-icon { font-size: 32px; }
.duration {
  position: absolute;
  bottom: 4px; right: 4px;
  background: rgba(0,0,0,0.55);
  color: #FFF;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}
.course-info { padding: 8px 10px 10px; }
.course-info h4 { font-size: 12px; font-weight: 600; color: var(--ink-dark); line-height: 1.35; }
.course-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 5px;
}
.course-meta span { font-size: 10px; color: var(--ink-light); }

/* 左右箭头 */
.carousel-arrow {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--ink-mid);
  font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  z-index: 2;
  line-height: 1;
  transition: opacity 0.2s, box-shadow 0.2s;
}
.carousel-arrow:not(.disabled):active { box-shadow: var(--shadow-sm); }
.carousel-arrow.disabled { opacity: 0.25; pointer-events: none; }
.carousel-left { margin-right: 4px; }
.carousel-right { margin-left: 4px; }

/* ====== 知识文档 ====== */
.doc-list { display: flex; flex-direction: column; gap: var(--space-sm); }
.doc-item {
  display: flex; gap: var(--space-md); padding: 14px;
  background: var(--card-bg); border-radius: var(--radius-md);
  border: 1px solid rgba(0,0,0,0.04); cursor: pointer;
  transition: background 0.15s;
}
.doc-item:active { background: var(--paper-warm); }
.doc-icon {
  width: 48px; height: 48px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; flex-shrink: 0;
}
.doc-icon.celadon { background: linear-gradient(135deg, #E8F3ED, #C8E6D4); }
.doc-icon.silk { background: linear-gradient(135deg, #FDF3E0, #E8D5A3); }
.doc-icon.carve { background: linear-gradient(135deg, #EDE5D8, #D4C4A8); }
.doc-icon.metal { background: linear-gradient(135deg, #F0E6D3, #E2C896); }
.doc-body { flex: 1; min-width: 0; }
.doc-body h4 { font-size: 14px; font-weight: 600; color: var(--ink-dark); }
.doc-body p {
  font-size: 12px; color: var(--ink-light); margin-top: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ====== 视频播放器 ====== */
.video-overlay {
  position: absolute; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-lg);
}
.video-overlay.fullscreen { background: #000; padding: 0; }
.video-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  width: 100%;
  max-width: 480px;
}
.video-card.fullscreen { max-width: none; border-radius: 0; background: #000; }
.video-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
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
  padding: var(--space-md) var(--space-lg);
  font-size: 13px; color: var(--ink-mid); line-height: 1.6;
}
</style>
