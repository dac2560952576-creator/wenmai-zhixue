import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/learn'
  },
  {
    path: '/learn',
    name: 'Learn',
    component: () => import('@/views/LearnPage.vue'),
    meta: { title: '学习中心' }
  },
  {
    path: '/practice',
    name: 'Practice',
    component: () => import('@/views/PracticePage.vue'),
    meta: { title: '练习工坊' }
  },
  {
    path: '/create',
    name: 'Create',
    component: () => import('@/views/CreatePage.vue'),
    meta: { title: '创作空间' }
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('@/views/CommunityPage.vue'),
    meta: { title: '分享社区' }
  },
  {
    path: '/post/:id',
    name: 'PostDetail',
    component: () => import('@/views/PostDetailPage.vue'),
    meta: { title: '作品详情' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfilePage.vue'),
    meta: { title: '我的' }
  },
  {
    path: '/crafts',
    name: 'Crafts',
    component: () => import('@/views/CraftsPage.vue'),
    meta: { title: '工艺文档库' }
  },
  {
    path: '/craft/:id',
    name: 'CraftDetail',
    component: () => import('@/views/CraftDetailPage.vue'),
    meta: { title: '工艺详情' }
  },
  {
    path: '/courses',
    name: 'CourseLibrary',
    component: () => import('@/views/CourseLibraryPage.vue'),
    meta: { title: '课程视频库' }
  },
  {
    path: '/article-history',
    name: 'ArticleHistory',
    component: () => import('@/views/ArticleHistoryPage.vue'),
    meta: { title: 'AI文案历史' }
  },
  {
    path: '/create-post',
    name: 'CreatePost',
    component: () => import('@/views/CreatePostPage.vue'),
    meta: { title: '发布作品' }
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: () => import('@/views/EditProfilePage.vue'),
    meta: { title: '编辑资料' }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/AuthPage.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/pattern-history',
    name: 'PatternHistory',
    component: () => import('@/views/PatternHistoryPage.vue'),
    meta: { title: '纹样历史' }
  },
  {
    path: '/messages',
    name: 'ChatList',
    component: () => import('@/views/ChatListPage.vue'),
    meta: { title: '消息' }
  },
  {
    path: '/chat/:id',
    name: 'Chat',
    component: () => import('@/views/ChatPage.vue'),
    meta: { title: '聊天' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
