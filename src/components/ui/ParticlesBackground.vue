<template>
  <div class="particles-container fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <!-- Generate particles using CSS -->
    <div 
      v-for="i in particleCount" 
      :key="i"
      class="particle"
      :style="getParticleStyle(i)"
    ></div>
  </div>
</template>

<script setup lang="ts">

const particleCount = 30 // Reduced from 50 for better performance

// Generate consistent random values for each particle
const getParticleStyle = (index: number) => {
  // Use index as seed for consistent positioning
  const seed = index * 1234567 % 100000
  const x = (seed % 100)
  const y = ((seed * 7) % 100)
  const size = 1 + ((seed * 3) % 3) // 1-3px
  const duration = 4 + ((seed * 5) % 6) // 4-9s
  const delay = (seed * 2) % 4 // 0-3s delay
  const opacity = 0.2 + ((seed * 11) % 30) / 100 // 0.2-0.5 opacity
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    opacity: opacity.toString()
  }
}
</script>

<style scoped>
.particles-container {
  will-change: transform;
  transform: translateZ(0);
}

.particle {
  position: absolute;
        background: radial-gradient(circle, rgb(var(--color-primary) / 0.6) 0%, rgb(var(--color-secondary) / 0.3) 70%, transparent 100%);
  border-radius: 50%;
  animation: floatParticle 6s ease-in-out infinite;
  transform: translateZ(0);
  will-change: transform;
}

@keyframes floatParticle {
  0%, 100% {
    transform: translateY(0) rotate(0deg) translateZ(0);
    opacity: 0.3;
  }
  25% {
    transform: translateY(-20px) rotate(90deg) translateZ(0);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-40px) rotate(180deg) translateZ(0);
    opacity: 0.8;
  }
  75% {
    transform: translateY(-20px) rotate(270deg) translateZ(0);
    opacity: 0.6;
  }
}

/* Additional particle variations for more dynamic movement */
.particle:nth-child(3n) {
  animation-name: floatParticleAlt;
}

.particle:nth-child(5n) {
  animation-direction: reverse;
}

.particle:nth-child(7n) {
  animation-name: floatParticleWave;
}

@keyframes floatParticleAlt {
  0%, 100% {
    transform: translateX(0) translateY(0) scale(1) translateZ(0);
    opacity: 0.2;
  }
  50% {
    transform: translateX(30px) translateY(-30px) scale(1.2) translateZ(0);
    opacity: 0.7;
  }
}

@keyframes floatParticleWave {
  0%, 100% {
    transform: translateX(0) translateY(0) rotate(0deg) translateZ(0);
    opacity: 0.25;
  }
  33% {
    transform: translateX(20px) translateY(-15px) rotate(120deg) translateZ(0);
    opacity: 0.5;
  }
  66% {
    transform: translateX(-10px) translateY(-25px) rotate(240deg) translateZ(0);
    opacity: 0.75;
  }
}

/* Performance optimizations */
@media (prefers-reduced-motion: reduce) {
  .particle {
    animation: none !important;
  }
}

/* Hide particles on very small screens to improve performance */
@media (max-width: 480px) {
  .particle:nth-child(n+16) {
    display: none;
  }
}
</style>
