<template>
  <div class="page">
    <div class="page-body" style="padding-top:8px;">
      <!-- 顶部标题 -->
      <div class="home-title">
        <img src="/logo.png" alt="文脉智学" class="home-logo" />
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

        <!-- 文脉时间线 -->
        <div class="timeline-card">
          <div class="timeline-label">📜 文脉</div>
          <div class="timeline-scroll">
            <div class="timeline-track">
              <div class="timeline-line"></div>
              <div
                v-for="p in timelinePeriods"
                :key="p.name"
                class="timeline-node"
                @click="$router.push('/era/' + encodeURIComponent(p.name))"
              >
                <div class="timeline-dot"></div>
                <div class="timeline-era">{{ p.name }}</div>
                <div class="timeline-era-wrap">
                  <span class="timeline-era-icon">{{ p.icon }}</span>
                  <span class="timeline-era-tag">{{ p.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 每日一艺 + 今日一问 -->
        <div class="daily-row">
          <div class="daily-craft-card" @click="$router.push('/craft/' + dailyCraft.id)">
            <div class="daily-craft-badge">📅 每日一艺</div>
            <div class="daily-craft-icon">{{ catIcon(dailyCraft.category) }}</div>
            <h4 class="daily-craft-name">{{ dailyCraft.name }}</h4>
            <p class="daily-craft-brief">{{ dailyCraft.brief?.slice(0, 26) }}…</p>
            <div class="daily-craft-meta">{{ dailyCraft.region }} · {{ dailyCraft.era }}</div>
            <span class="daily-craft-btn">📖 开始学习 →</span>
          </div>

          <div class="daily-quiz-card" v-if="quizQuestion">
            <div class="daily-quiz-badge">❓ 今日一问</div>
            <p class="daily-quiz-question">{{ quizQuestion.question }}</p>

            <!-- 答题前：选项 -->
            <div class="daily-quiz-body">
              <div v-if="!quizAnswered" class="daily-quiz-options">
                <button
                  v-for="(opt, i) in quizQuestion.options"
                  :key="i"
                  class="daily-quiz-option"
                  @click.stop="selectQuizOption(i)"
                >{{ opt }}</button>
              </div>

              <!-- 答题后：解析替换选项 -->
              <div v-else class="daily-quiz-feedback">
                <p v-if="quizSelected === quizQuestion.answer" class="quiz-result correct">✅ 回答正确！</p>
                <p v-else class="quiz-result wrong">❌ 正确答案是「{{ quizQuestion.options[quizQuestion.answer] }}」</p>
                <p class="daily-quiz-explain">{{ quizQuestion.explanation }}</p>
                <button class="daily-quiz-next" @click.stop="nextQuizQuestion">🔄 换一题</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷入口横向滑动 -->
        <div class="quick-scroll">
          <div class="quick-scroll-track">
            <div class="quick-item" v-for="entry in quickEntries" :key="entry.label" @click="$router.push(entry.to)">
              <div class="quick-icon" :class="entry.iconClass">{{ entry.icon }}</div>
              <span>{{ entry.label }}</span>
            </div>
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

    <!-- 课程视频播放器（B站嵌入） -->
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import craftsData from '@/data/工艺知识库.json'
import quizData from '@/data/题库.json'
import { getAllCourseViews, incrementCourseViews, trackActiveDay } from '@/services/db'
import gsap from 'gsap'

const authStore = useAuthStore()

// ---- 推荐课程 ----
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
    bvid: 'BV1oj421R7QT', desc: '省级非遗传承人薛氏刺绣揭秘双面绣核心秘诀—系小针无结无线头，正反两面同样精美。'
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
    bvid: 'BV1VE411D7dz', desc: '《匠心冶陶》纪录片第九集：青花及釉下彩绘—分水技法、勾线点染，完整演示青花绘制全流程。'
  },
  {
    id: 5, title: '苏绣双面绣针法精讲', icon: '🧵', duration: '12:46',
    craft: '苏绣', tagClass: 'tag-gold',
    gradient: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
    bvid: 'BV1cV411j7B7', desc: '苏绣针法教学系列合集：双面绣兰草、滚针、虚实针、乱针绣等核心针法逐一讲解示范。'
  },
  {
    id: 6, title: '东阳木雕浮雕入门', icon: '🪚', duration: '15:20',
    craft: '东阳木雕', tagClass: 'tag-gold',
    gradient: 'linear-gradient(135deg, #EDE5D8, #D4C4A8)',
    bvid: 'BV1Yh411B7sc', desc: '东阳木雕挂屏《清荷凝香》：樟木独板浅浮雕技法完整演示，涵盖开线条、修光全流程。'
  }
])
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
onMounted(async () => {
  startHeroTimer()
  animateHeroContent()
  if (authStore.isLoggedIn) trackActiveDay()
  fetchBilibiliMeta()

  // 文脉时间线入场动画
  await nextTick()
  gsap.from('.timeline-node', {
    opacity: 0, x: 20, duration: 0.5,
    stagger: 0.06, ease: 'power2.out',
    delay: 0.3
  })
  gsap.from('.timeline-line', {
    scaleX: 0, duration: 0.8,
    ease: 'power2.out', delay: 0.3,
    transformOrigin: 'left center'
  })
  // 每日卡片弹入
  gsap.from('.daily-craft-card', { opacity: 0, y: -16, duration: 0.45, ease: 'back.out(1.4)', delay: 0.5 })
  gsap.from('.daily-quiz-card', { opacity: 0, y: -16, duration: 0.45, ease: 'back.out(1.4)', delay: 0.6 })
  // 课程卡片 + 文档列表：延迟入场
  gsap.from('.course-card', { opacity: 0, y: 20, duration: 0.45, stagger: 0.08, ease: 'power2.out', delay: 0.8 })
  gsap.from('.doc-item', { opacity: 0, y: 16, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 1.0 })
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
  animateHeroContent()
  resetHeroTimer()
}

function animateHeroContent() {
  nextTick(() => {
    const active = document.querySelector('.hero-slide:nth-child(' + (heroTrack.value + 1) + ')')
    if (!active) return
    const els = active.querySelectorAll('.hero-icon, h2, p')
    gsap.fromTo(els, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power2.out' })
  })
}
function slideNext() {
  heroTrack.value++
  heroTransition.value = true
  heroReal.value = (heroReal.value + 1) % N
  animateHeroContent()
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

// ---- 文脉时间线（每个时代展示一个代表工艺） ----
const timelinePeriods = [
  { name: '新石器', icon: '🧵', label: '良渚丝绸', detail: '4700年前，世界最早的丝织物' },
  { name: '春秋战国', icon: '🪡', label: '刺绣起源', detail: '锁绣针法出现' },
  { name: '汉代', icon: '🎭', label: '皮影雏形', detail: '皮影戏与蜀绣并行发展' },
  { name: '唐代', icon: '🏺', label: '越窑青瓷', detail: '海上丝路，青瓷远销' },
  { name: '宋代', icon: '🏺', label: '龙泉鼎盛', detail: '粉青梅子青，瓷艺巅峰' },
  { name: '元代', icon: '🫙', label: '青花兴起', detail: '钴料绘制，龙泉大量外销' },
  { name: '明代', icon: '🔔', label: '景泰蓝', detail: '掐丝珐琅，紫砂木雕并行' },
  { name: '清代', icon: '🪡', label: '苏绣巅峰', detail: '双面绣成熟，漆器铁画繁荣' },
  { name: '现代', icon: '🏛️', label: '非遗传承', detail: '多门工艺入选人类非遗' }
]

// ---- 每日一艺（按日期伪随机选取） ----
const categoryIcons = { '陶瓷': '🏺', '织绣': '🧵', '雕刻': '🪚', '金属工艺': '🔔', '漆器': '🏮', '民间美术': '🎨', '民间表演': '🎭', '其他': '📦' }
function catIcon(cat) { return categoryIcons[cat] || '📖' }

const allCrafts = (() => {
  const result = []
  for (const cat of craftsData) {
    for (const item of cat.items) {
      result.push({ ...item, category: cat.category })
    }
  }
  return result
})()

const dailyCraft = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (let i = 0; i < today.length; i++) { hash = ((hash << 5) - hash) + today.charCodeAt(i); hash |= 0 }
  return allCrafts[Math.abs(hash) % allCrafts.length]
})

// ---- 今日一问（按日期选题，不记录） ----
const quizQuestion = ref(null)
const quizSelected = ref(-1)
const quizAnswered = ref(false)

function getTodayQuizIndex() {
  const today = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (let i = 0; i < today.length; i++) { hash = ((hash << 5) - hash) + today.charCodeAt(i); hash |= 0 }
  return Math.abs(hash) % quizData.length
}

function pickTodayQuestion() {
  quizQuestion.value = quizData[getTodayQuizIndex()]
  quizSelected.value = -1
  quizAnswered.value = false
}
function selectQuizOption(i) {
  if (quizAnswered.value) return
  quizSelected.value = i
  quizAnswered.value = true
}
// "换一题"：随机选一题（不受日期限制）
function nextQuizQuestion() {
  let idx = Math.floor(Math.random() * quizData.length)
  if (quizData.length > 1 && idx === getTodayQuizIndex()) {
    idx = (idx + 1) % quizData.length
  }
  quizQuestion.value = quizData[idx]
  quizSelected.value = -1
  quizAnswered.value = false
}
pickTodayQuestion()

// ---- 快捷入口（横向滑动） ----
const quickEntries = [
  { icon: '🏺', label: '龙泉青瓷', to: '/craft/longquan', iconClass: 'celadon' },
  { icon: '🧵', label: '杭州丝绸', to: '/craft/hangzhou-silk', iconClass: 'silk' },
  { icon: '✏️', label: 'AI问答', to: '/practice', iconClass: 'practice' },
  { icon: '🎨', label: '纹样工坊', to: '/create', iconClass: 'create' },
  { icon: '📹', label: '课程视频', to: '/courses', iconClass: 'video' },
  { icon: '📖', label: '工艺文档', to: '/crafts', iconClass: 'docs' }
]

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
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}
.home-logo {
  width: 40px; height: 40px;
  border-radius: var(--radius-sm);
  object-fit: contain;
  flex-shrink: 0;
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

/* ====== 文脉时间线 ====== */
.timeline-card {
  background: linear-gradient(160deg, #FDFAF5 0%, #F8F5EE 50%, #FAF6F0 100%);
  border-radius: var(--radius-md);
  border: 1px solid rgba(139,119,90,0.1);
  padding: 14px;
  margin-bottom: var(--space-lg);
}
.timeline-label {
  font-size: 13px; font-weight: 700; color: var(--silk-gold);
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 1px; margin-bottom: var(--space-sm);
}
.timeline-scroll {
  position: relative;
}
.timeline-track {
  display: flex; gap: 0;
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  padding: 8px 0 4px;
  scrollbar-width: none; position: relative;
}
.timeline-track::-webkit-scrollbar { display: none; }
.timeline-line {
  position: absolute; top: 20px; left: 0;
  width: 900px; height: 1px;
  background: linear-gradient(90deg, var(--celadon-light) 0%, var(--celadon) 50%, var(--celadon-light) 100%);
  pointer-events: none;
}
.timeline-node {
  display: flex; flex-direction: column; align-items: center;
  flex-shrink: 0; min-width: 96px; padding: 0 4px;
  cursor: pointer; position: relative; z-index: 1;
  transition: transform 0.2s;
}
.timeline-node:active { transform: scale(0.95); }
.timeline-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--celadon-light); border: 2px solid var(--card-bg);
  box-shadow: 0 0 0 1.5px var(--celadon-light);
  flex-shrink: 0; margin-bottom: 6px;
}
.timeline-era {
  font-size: 11px; font-weight: 600; color: var(--ink-light);
  font-family: 'Noto Serif SC', serif;
  margin-bottom: 6px; white-space: nowrap;
}
.timeline-era-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  cursor: pointer; padding: 4px 6px; border-radius: 8px;
  transition: transform 0.15s, background 0.15s;
}
.timeline-era-wrap:hover { transform: scale(1.08); background: var(--celadon-pale); }
.timeline-era-icon { font-size: 22px; line-height: 1; }
.timeline-era-tag {
  font-size: 11px; color: var(--ink-mid); font-weight: 600;
  white-space: nowrap; font-family: 'Noto Serif SC', serif;
}

/* ====== 每日一艺 + 今日一问 ====== */
.daily-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

/* ====== 每日一艺卡片 ====== */
.daily-craft-card {
  background: linear-gradient(160deg, #FDF8F0 0%, #F0EBE0 100%);
  border-radius: var(--radius-md);
  padding: 16px 14px;
  display: flex; flex-direction: column; align-items: center;
  cursor: pointer; border: 1px solid rgba(139,119,90,0.1);
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative; overflow: hidden;
}
.daily-craft-card::before {
  content: ''; position: absolute; top: -16px; right: -16px;
  width: 64px; height: 64px; border-radius: 50%;
  background: rgba(184,149,106,0.06);
}
.daily-craft-card:active { transform: scale(0.97); }
.daily-craft-badge {
  font-size: 13px; font-weight: 700; color: var(--silk-gold);
  margin-bottom: 10px; letter-spacing: 0.5px;
}
.daily-craft-icon {
  font-size: 40px; margin-bottom: 6px; line-height: 1;
}
.daily-craft-name {
  font-size: 15px; font-weight: 700; color: var(--ink-dark);
  font-family: 'Noto Serif SC', serif;
  margin-bottom: 4px;
}
.daily-craft-brief {
  font-size: 11px; color: var(--ink-light); text-align: center;
  line-height: 1.5; margin-bottom: 6px;
}
.daily-craft-meta {
  font-size: 10px; color: var(--ink-disabled);
  margin-bottom: 12px;
}
.daily-craft-btn {
  font-size: 12px; font-weight: 600; color: #FFF;
  background: linear-gradient(135deg, var(--celadon), var(--celadon-dark));
  padding: 8px 18px; border-radius: var(--radius-full);
  letter-spacing: 0.5px;
}

/* ====== 今日一问卡片 ====== */
.daily-quiz-card {
  background: linear-gradient(160deg, #F4F9F6 0%, #F0F5F2 50%, #F6F8F4 100%);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid rgba(74,139,122,0.08);
  display: flex; flex-direction: column;
}
.daily-quiz-badge {
  font-size: 12px; font-weight: 700; color: var(--celadon-dark);
  letter-spacing: 0.5px;
  align-self: flex-start;
  margin-bottom: 10px;
}
.daily-quiz-question {
  font-size: 15px; font-weight: 600; color: var(--ink-dark);
  line-height: 1.6; margin-bottom: 14px;
}
.daily-quiz-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.daily-quiz-body {
  min-height: 108px;
  display: flex; flex-direction: column; justify-content: center;
}
.daily-quiz-option {
  padding: 12px 14px; border-radius: var(--radius-sm);
  font-size: 14px; text-align: center; cursor: pointer;
  border: 1.5px solid var(--border-color);
  background: var(--card-bg);
  color: var(--ink-dark);
  transition: all 0.15s;
  line-height: 1.4;
  min-height: 44px;
  display: flex; align-items: center; justify-content: center;
}
.daily-quiz-option:not(.disabled):active {
  border-color: var(--celadon); background: var(--celadon-pale);
  transform: scale(0.97);
}
.daily-quiz-option.correct {
  border-color: var(--celadon-dark); background: var(--celadon-pale);
  color: var(--celadon-dark); font-weight: 600; border-width: 2px;
}
.daily-quiz-option.wrong {
  border-color: var(--vermilion); background: #FCEAE9;
  color: var(--vermilion); border-width: 2px;
}
.daily-quiz-option.disabled { cursor: default; opacity: 0.6; }
.daily-quiz-feedback {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 14px 12px; background: var(--paper-warm);
  border-radius: var(--radius-sm); border: 1px solid var(--border-color);
}
.quiz-result { font-size: 14px; font-weight: 600; margin: 0; }
.quiz-result.correct { color: var(--celadon-dark); }
.quiz-result.wrong { color: var(--vermilion); }
.daily-quiz-explain {
  font-size: 13px; color: var(--ink-mid); line-height: 1.6; margin: 0; text-align: center;
}
.daily-quiz-next {
  padding: 8px 20px;
  border: 1px solid var(--celadon-dark); border-radius: var(--radius-full);
  background: transparent; font-size: 13px; color: var(--celadon-dark);
  cursor: pointer; transition: all 0.15s; font-weight: 500;
}
.daily-quiz-next:active { background: var(--celadon-pale); }

/* ====== 快捷入口横向滑动 ====== */
.quick-scroll {
  margin-bottom: var(--space-sm);
  position: relative;
}
.quick-scroll::before,
.quick-scroll::after {
  content: ''; position: absolute; top: 0; bottom: 0; z-index: 1;
  width: 16px; pointer-events: none;
}
.quick-scroll::before {
  left: 0;
  background: linear-gradient(to right, var(--paper), transparent);
}
.quick-scroll::after {
  right: 0;
  background: linear-gradient(to left, var(--paper), transparent);
}
.quick-scroll-track {
  display: flex; gap: var(--space-xs);
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  padding: 4px 0;
  scrollbar-width: none;
}
.quick-scroll-track::-webkit-scrollbar { display: none; }

.quick-item {
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--card-bg);
  border: 1px solid rgba(0,0,0,0.03);
  cursor: pointer; flex-shrink: 0;
  transition: transform 0.15s;
  scroll-snap-align: start;
  min-width: 76px;
}
.quick-item:active { transform: scale(0.94); }
.quick-icon {
  width: 42px; height: 42px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.quick-icon.celadon { background: linear-gradient(135deg, #E8F3ED, #C8E6D4); }
.quick-icon.silk { background: linear-gradient(135deg, #FDF3E0, #E8D5A3); }
.quick-icon.practice { background: linear-gradient(135deg, #FFF3E0, #FFE0B2); }
.quick-icon.create { background: linear-gradient(135deg, #FCEAE9, #F8CDD0); }
.quick-icon.video { background: linear-gradient(135deg, #E8F0FE, #C8DCF8); }
.quick-icon.docs { background: linear-gradient(135deg, #EDE5D8, #D4C4A8); }
.quick-item span { font-size: 11px; color: var(--ink-mid); font-weight: 500; white-space: nowrap; }

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
.course-cover {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
}
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
.video-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  width: 100%;
  max-width: 480px;
}
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
