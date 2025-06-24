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

export {}
