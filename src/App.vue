<template>
  <div class="app-shell">
    <div class="app-container">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <TabBar v-if="showTabBar" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { subscribeToMessages, unsubscribe } from '@/services/supabase'
import { addUnreadPartner } from '@/services/db'
import TabBar from '@/components/TabBar.vue'

const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

const hideTabBarRoutes = ['Auth', 'PostDetail', 'ChatList', 'Chat']
const showTabBar = computed(() => !hideTabBarRoutes.includes(route.name))

let globalMsgChannel = null

function startMessageListener() {
  if (!authStore.isLoggedIn) return
  stopMessageListener()
  globalMsgChannel = subscribeToMessages(authStore.user.id, (payload) => {
    addUnreadPartner(payload.new.from_user)
  })
}

function stopMessageListener() {
  if (globalMsgChannel) {
    unsubscribe(globalMsgChannel)
    globalMsgChannel = null
  }
}

watch(() => authStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) startMessageListener()
  else stopMessageListener()
})

onMounted(async () => {
  appStore.init()
  await authStore.init()
  authStore.listen()
  if (authStore.isLoggedIn) startMessageListener()
})

onUnmounted(() => {
  stopMessageListener()
})
</script>

<style scoped>
.app-shell {
  height: 100%;
  width: 100%;
  background: linear-gradient(170deg, #D5CFC4 0%, #DFD8CB 30%, #E8E2D8 60%, #EDE9E0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.app-container {
  height: 100%;
  width: 100%;
  max-width: 480px;
  background: var(--paper);
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
}

@media (min-width: 481px) {
  .app-shell {
    padding: 24px;
  }
  .app-container {
    height: 100%;
    max-height: 900px;
    border-radius: 40px;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.04),
      0 0 0 3px rgba(0,0,0,0.02),
      0 20px 60px rgba(0,0,0,0.08);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
