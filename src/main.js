import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import App from '@/App.vue'
import { initDB } from '@/services/db'
import '@/styles/global.css'

async function boot() {
  try {
    await initDB()
  } catch (e) {
    console.error('SQLite 初始化失败，部分功能不可用', e)
  }
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}
boot()
