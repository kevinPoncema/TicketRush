import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/b2c/LandingView.vue')
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
    }
  ]
})

export default router
