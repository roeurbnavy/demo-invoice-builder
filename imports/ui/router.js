import { createRouter, createWebHistory } from 'vue-router'
import Home from './Home.vue'
import About from './About.vue'
import BuilderWrapper from './BuilderWrapper.vue'
import ConfigManager from './ConfigManager.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/about',
      name: 'about',
      component: About,
    },
    {
      path: '/builder/:id?',
      name: 'builder',
      component: BuilderWrapper,
      props: true,
    },
    {
      path: '/config',
      name: 'config',
      component: ConfigManager,
    },
  ],
})
