import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/b2c/LandingView.vue')
    },
    {
      path: '/auth/register',
      name: 'register',
      component: () => import('../views/auth/RegisterTenantView.vue')
    },
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue')
    },
    {
      path: '/b2b',
      name: 'b2b-dashboard',
      component: () => import('../views/b2b/DashboardView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: 'staff',
          name: 'staff-manager',
          component: () => import('../views/b2b/StaffManagerView.vue')
        }
      ]
    }
  ]
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth/login')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/')
  } else {
    next()
  }
})

export default router
