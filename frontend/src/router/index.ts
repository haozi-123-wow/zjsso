import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Authorize from '@/views/Authorize.vue'
import Callback from '@/views/Callback.vue'
import Profile from '@/views/Profile.vue'
import Admin from '@/views/Admin.vue'
import { loadTokens, getAccessToken } from '@/utils/api'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login },
  { path: '/authorize', name: 'authorize', component: Authorize },
  { path: '/callback', name: 'callback', component: Callback },
  { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/admin', name: 'admin', component: Admin, meta: { requiresAuth: true, requiresAdmin: true } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth) {
    loadTokens()
    if (!getAccessToken()) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }
  next()
})

export default router
