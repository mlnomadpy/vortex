import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/playground',
      name: 'Playground',
      component: () => import('@/views/Playground.vue')
    },
    {
      path: '/docs',
      name: 'Documentation',
      component: () => import('@/views/Documentation.vue')
    },
    {
      path: '/mnist',
      name: 'MnistClassifier',
      component: () => import('@/views/MnistClassifier.vue')
    }
  ]
})

export default router
