/// <reference types="vite/client" />

declare global {
  interface Window {
    MathJax: {
      typesetPromise: () => Promise<void>
      tex: {
        inlineMath: string[][]
        displayMath: string[][]
      }
    }
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

export {}
