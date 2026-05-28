import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const isOnline = ref(navigator.onLine)

  function updateOnline() {
    isOnline.value = navigator.onLine
  }

  function init() {
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
  }

  return { isOnline, init }
})
