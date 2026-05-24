import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import Login from '@/views/Login.vue'
import Authorize from '@/views/Authorize.vue'
import Callback from '@/views/Callback.vue'
import Profile from '@/views/Profile.vue'
import Admin from '@/views/Admin.vue'
import Activation from '@/views/Activation.vue'
import NotFound from '@/views/NotFound.vue'
import { loadTokens, getAccessToken } from '@/utils/api'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login },
  { path: '/authorize', name: 'authorize', component: Authorize },
  { path: '/callback', name: 'callback', component: Callback },
  { path: '/verify-activation', name: 'verify-activation', component: Activation },
  { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/admin', name: 'admin', component: Admin, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound }
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
