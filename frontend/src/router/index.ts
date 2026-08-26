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
      path: '/e/:id',
      name: 'event-detail',
      component: () => import('../views/b2c/EventDetailView.vue')
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../views/b2c/CheckoutView.vue')
    },
    
    {
      path: '/success',
      name: 'success',
      component: () => import('../views/b2c/SuccessView.vue')
    },
    {
      path: '/my-tickets',
      name: 'my-tickets',
      component: () => import('../views/b2c/MyTicketsView.vue')
    },
    {
      path: '/recover',
      name: 'recover',
      component: () => import('../views/b2c/RecoverTicketsView.vue')
    },

    
    {
      path: '/org/:tenantId',
      name: 'org-landing',
      component: () => import('../views/b2c/OrgLandingView.vue')
    },
    {
      path: '/scanner',
      name: 'scanner',
      component: () => import('../views/b2b/StaffScannerView.vue')
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
          path: '',
          name: 'b2b-home',
          component: () => import('../views/b2b/DashboardHomeView.vue')
        },
        {
          path: 'staff',
          name: 'staff-manager',
          component: () => import('../views/b2b/StaffManagerView.vue')
        },
        {
          path: 'integrations',
          name: 'integrations',
          component: () => import('../views/b2b/IntegrationsView.vue')
        },
        
        {
          path: 'events',
          name: 'event-list',
          component: () => import('../views/b2b/EventListView.vue')
        },
        {
          path: 'events/new',
          name: 'event-create',
          component: () => import('../views/b2b/EventEditorView.vue')
        },
        {
          path: 'events/:id/analytics',
          name: 'b2b-event-analytics',
          component: () => import('../views/b2b/EventAnalyticsView.vue')
        },
        {
          path: 'events/:id/edit',
          name: 'event-edit',
          component: () => import('../views/b2b/EventEditorView.vue')
        }
      ]
    }
  ]
})

// Navigation Guard
router.beforeEach((to, _from, next) => {
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
