import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Authorize from '@/views/Authorize.vue'
import Callback from '@/views/Callback.vue'
import Profile from '@/views/Profile.vue'
import Admin from '@/views/Admin.vue'

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

export default router
