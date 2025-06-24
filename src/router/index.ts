import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(),
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
    }
  ]
})

export default router
