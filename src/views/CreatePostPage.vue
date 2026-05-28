<template>
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="page-title">{{ isEditing ? '编辑作品' : '发布作品' }}</h1>
      <div class="header-spacer"></div>
    </header>

    <div class="page-body">
      <!-- 分区选择 -->
      <div class="section-label">选择分区</div>
      <div class="craft-tags">
        <button
          v-for="c in craftTypes"
          :key="c"
          :class="['craft-tag', { active: form.craft_type === c }]"
          @click="form.craft_type = c"
        >{{ c }}</button>
      </div>

      <!-- 选择图片 -->
      <div class="section-label">
        选择图片
        <span class="label-extra" v-if="form.images.length">{{ form.images.length }} 张已选</span>
      </div>
      <div v-if="patternImages.length" class="image-picker">
        <div
          v-for="item in patternImages"
          :key="item.id"
          :class="['picker-image', { selected: isImageSelected(item.id) }]"
          @click="toggleImage(item)"
        >
          <img :src="item.image_url" :alt="item.topic" />
          <div class="picker-check">{{ isImageSelected(item.id) ? '✓' : '' }}</div>
        </div>
      </div>
      <div v-else class="empty-hint">暂无纹样图片，请先去创作空间生成</div>

      <!-- 选择文案 -->
      <div class="section-label">选择文案</div>
      <div v-if="articleHistory.length" class="article-picker">
        <div
          v-for="item in articleHistory"
          :key="item.id"
          :class="['picker-article', { active: selectedArticleId === item.id }]"
          @click="selectArticle(item)"
        >
          <div class="picker-article-topic">{{ item.topic }}</div>
          <div class="picker-article-excerpt">{{ item.content.slice(0, 80) }}{{ item.content.length > 80 ? '...' : '' }}</div>
        </div>
      </div>
      <div v-else class="empty-hint">暂无文案记录，请先去创作空间生成</div>

      <!-- 文案编辑 -->
      <div class="section-label">编辑文案</div>
      <textarea
        v-model="form.content"
        class="editor"
        rows="8"
        placeholder="选择上方文案后在此编辑，或直接输入内容..."
      ></textarea>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-bar" v-if="hasContent">
      <button class="btn-draft" @click="saveDraft">存草稿</button>
      <button class="btn-publish" @click="handlePublish" :disabled="!canPublish">{{ isEditing ? '更新作品' : '发布作品' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createPost, updatePost, fetchPostDetail } from '@/services/supabase'
import { fetchMergedPatternHistory, fetchMergedArticleHistory, getPostDraft, savePostDraft, clearPostDraft } from '@/services/db'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const editPostId = ref(null)
const isEditing = computed(() => !!editPostId.value)

const craftTypes = ['龙泉青瓷', '杭州丝绸', '景德镇瓷器', '宜兴紫砂', '苏绣', '景泰蓝', '皮影戏', '中国剪纸', '东阳木雕', '潍坊风筝', '福州脱胎漆器', '木版年画']

const patternImages = ref([])
const articleHistory = ref([])
const selectedArticleId = ref(null)
const hasDraftChanged = ref(false)

const form = reactive({
  craft_type: '',
  images: [],
  content: '',
  topic: ''
})

const hasContent = computed(() => form.craft_type || form.images.length || form.content.trim())
const canPublish = computed(() => form.craft_type && (form.images.length || form.content.trim()))

function isImageSelected(id) {
  return form.images.some(img => img.id === id)
}

function toggleImage(item) {
  const idx = form.images.findIndex(img => img.id === item.id)
  if (idx >= 0) {
    form.images.splice(idx, 1)
  } else {
    form.images.push({ id: item.id, url: item.image_url, topic: item.topic })
  }
  hasDraftChanged.value = true
}

function selectArticle(item) {
  if (selectedArticleId.value === item.id) {
    selectedArticleId.value = null
    form.content = ''
    form.topic = ''
    return
  }
  selectedArticleId.value = item.id
  form.content = item.content
  form.topic = item.topic
  if (!form.craft_type && item.topic) {
    for (const c of craftTypes) {
      if (item.topic.includes(c) || c.includes(item.topic)) {
        form.craft_type = c
        break
      }
    }
  }
  hasDraftChanged.value = true
}

function saveDraft() {
  savePostDraft({
    craft_type: form.craft_type,
    images: form.images,
    content: form.content,
    topic: form.topic
  })
  hasDraftChanged.value = false
  alert('草稿已保存')
}

async function handlePublish() {
  if (!authStore.isLoggedIn) {
    router.push('/auth')
    return
  }
  const imageUrl = form.images.map(img => img.url).join(',')
  const payload = {
    title: form.topic || '未命名作品',
    content: form.content,
    image_url: imageUrl || '',
    craft_type: form.craft_type
  }
  try {
    if (isEditing.value) {
      const { error } = await updatePost(editPostId.value, payload)
      if (!error) {
        clearPostDraft()
        hasDraftChanged.value = false
        alert('更新成功！')
        router.push('/post/' + editPostId.value)
      } else {
        console.error('更新失败:', error)
        alert('更新失败：' + (error.message || '请重试'))
      }
    } else {
      const { error } = await createPost({ ...payload, user_id: authStore.user.id, ai_review: [] })
      if (!error) {
        clearPostDraft()
        hasDraftChanged.value = false
        alert('发布成功！')
        router.push('/community')
      } else {
        console.error('发布失败:', error)
        alert('发布失败：' + (error.message || '请重试'))
      }
    }
  } catch (e) {
    console.error('操作异常:', e)
    alert('操作失败：' + (e.message || '网络异常，请重试'))
  }
}

function goBack() {
  if (hasDraftChanged.value && hasContent.value) {
    const save = confirm('是否保存草稿？\n\n选择"确定"保存草稿，下次进入可恢复。\n选择"取消"将丢弃当前内容。')
    if (save) {
      saveDraft()
    } else {
      clearPostDraft()
    }
  }
  router.back()
}

onBeforeRouteLeave((_to, _from, next) => {
  if (hasDraftChanged.value && hasContent.value) {
    const save = confirm('是否保存草稿？\n\n选择"确定"保存草稿，下次进入可恢复。\n选择"取消"将丢弃当前内容。')
    if (save) {
      savePostDraft({
        craft_type: form.craft_type,
        images: form.images,
        content: form.content,
        topic: form.topic
      })
      hasDraftChanged.value = false
    } else {
      clearPostDraft()
    }
  }
  next()
})

onMounted(async () => {
  patternImages.value = await fetchMergedPatternHistory()
  articleHistory.value = await fetchMergedArticleHistory()

  // 编辑模式：加载已有帖子数据
  const editId = route.query.edit
  if (editId) {
    editPostId.value = Number(editId)
    const { data } = await fetchPostDetail(editPostId.value)
    if (data && data.user_id === authStore.user?.id) {
      form.craft_type = data.craft_type || ''
      form.content = data.content || ''
      form.topic = data.title || ''
      if (data.image_url) {
        form.images = data.image_url.split(',').map((url, i) => ({ id: `edit-${i}`, url, topic: data.title }))
        // 将原帖图片注入选择器，使编辑时能看到已选图片的选中状态
        const existingUrls = new Set(patternImages.value.map(p => p.image_url))
        for (const img of form.images) {
          if (!existingUrls.has(img.url)) {
            patternImages.value.unshift({ id: img.id, image_url: img.url, topic: img.topic })
          }
        }
      }
      return
    }
  }

  // 新建模式：恢复草稿
  const draft = getPostDraft()
  if (draft) {
    form.craft_type = draft.craft_type || ''
    form.images = draft.images || []
    form.content = draft.content || ''
    form.topic = draft.topic || ''
  }
})
</script>

<style scoped>
.page-body { padding: var(--space-lg); overflow-y: auto; flex: 1; }

/* 分区 */
.section-label {
  font-size: 14px; font-weight: 600; color: var(--ink-dark);
  margin-bottom: var(--space-sm); margin-top: var(--space-xl);
  display: flex; align-items: center; gap: 8px;
}
.section-label:first-child { margin-top: 0; }
.label-extra { font-size: 11px; font-weight: 400; color: var(--celadon-dark); }

.craft-tags { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
.craft-tag {
  padding: 6px 14px; border-radius: var(--radius-full);
  font-size: 12px; border: 1px solid var(--border-color);
  background: var(--card-bg); color: var(--ink-mid);
  cursor: pointer; transition: all 0.15s;
}
.craft-tag.active {
  border-color: var(--celadon-dark);
  background: var(--celadon-pale); color: var(--celadon-dark);
  font-weight: 600;
}

/* 图片选择 */
.image-picker {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-sm);
}
.picker-image {
  aspect-ratio: 1; border-radius: var(--radius-sm); overflow: hidden;
  position: relative; cursor: pointer; border: 2.5px solid transparent;
  background: var(--paper-warm); border: 1px solid var(--border-color);
  transition: border-color 0.15s, transform 0.15s;
}
.picker-image:active { transform: scale(0.97); }
.picker-image.selected { border-color: var(--celadon-dark); border-width: 2.5px; }
.picker-image img {
  width: 100%; height: 100%; object-fit: cover;
}
.picker-check {
  position: absolute; top: 6px; right: 6px;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--celadon-dark); color: #FFF;
  font-size: 12px; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.15s;
}
.picker-image.selected .picker-check { opacity: 1; }

/* 文案选择 */
.article-picker { display: flex; flex-direction: column; gap: var(--space-sm); }
.picker-article {
  padding: 12px 14px; background: var(--card-bg);
  border-radius: var(--radius-sm); border: 1px solid rgba(0,0,0,0.04);
  cursor: pointer; border-left: 3px solid transparent;
  transition: border-color 0.15s, background 0.15s;
}
.picker-article.active {
  border-left-color: var(--silk-gold);
  background: #FFFDF7;
}
.picker-article-topic { font-size: 13px; font-weight: 600; color: var(--ink-dark); margin-bottom: 4px; }
.picker-article-excerpt { font-size: 11px; color: var(--ink-light); line-height: 1.5; }

/* 编辑器 */
.editor {
  width: 100%; padding: 14px; border: 1px solid var(--border-color);
  border-radius: var(--radius-sm); font-size: 14px; line-height: 1.8;
  outline: none; resize: vertical; color: var(--ink-dark);
  background: var(--paper); box-sizing: border-box;
  transition: border-color 0.2s;
}
.editor:focus { border-color: var(--celadon); }
.editor::placeholder { color: var(--ink-disabled); }

/* 空提示 */
.empty-hint {
  font-size: 12px; color: var(--ink-light);
  padding: 24px; text-align: center;
}

/* 底部栏 */
.bottom-bar {
  padding: var(--space-md) var(--space-lg);
  display: flex; gap: var(--space-md);
  background: var(--card-bg); border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}
.btn-draft {
  flex: 1; padding: 12px;
  border: 1.5px solid var(--celadon-dark); border-radius: var(--radius-sm);
  background: transparent; color: var(--celadon-dark);
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.btn-draft:active { background: var(--celadon-pale); }
.btn-publish {
  flex: 2; padding: 12px;
  border: none; border-radius: var(--radius-sm);
  background: var(--gradient-brand);
  color: #FFF; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: opacity 0.15s;
}
.btn-publish:active { opacity: 0.85; }
.btn-publish:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
