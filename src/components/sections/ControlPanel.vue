<template>
  <div class="control-panel">
    <div 
      v-for="group in controlGroups" 
      :key="group.id" 
      class="control-group"
      :class="{ 'is-open': openGroups.includes(group.id) }"
    >
      <button class="group-header" @click="toggleGroup(group.id)">
        <div class="header-content">
          <component :is="group.icon" class="group-icon" />
          <span class="group-title">{{ group.title }}</span>
        </div>
        <ChevronDownIcon class="group-chevron" />
      </button>
      <div v-if="openGroups.includes(group.id)" class="group-content">
        <component :is="group.component" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ControlsGrid from '@/components/sections/ControlsGrid.vue'
import VisualizationControls from '@/components/sections/VisualizationControls.vue'
import OptimizationControls from '@/components/visualization/OptimizationControls.vue'
import ClassToggles from '@/components/sections/ClassToggles.vue'
import { 
  CogIcon, 
  EyeIcon, 
  RocketLaunchIcon, 
  Square3Stack3DIcon,
  ChevronDownIcon
} from '@/components/ui/icons'

const openGroups = ref(['optimization'])

const controlGroups = [
  { id: 'optimization', title: 'Optimization', icon: RocketLaunchIcon, component: OptimizationControls },
  { id: 'data', title: 'Data & Neurons', icon: CogIcon, component: ControlsGrid },
  { id: 'visualization', title: 'Visualization', icon: EyeIcon, component: VisualizationControls },
  { id: 'classes', title: 'Class Filters', icon: Square3Stack3DIcon, component: ClassToggles },
]

function toggleGroup(groupId: string) {
  const index = openGroups.value.indexOf(groupId)
  if (index > -1) {
    openGroups.value.splice(index, 1)
  } else {
    openGroups.value.push(groupId)
  }
}
</script>

<style scoped>
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.control-group.is-open {
  background: rgb(var(--bg-tertiary));
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}

.group-header:hover {
  background: rgb(var(--bg-hover));
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(var(--color-primary));
}

.group-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.group-chevron {
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(var(--text-secondary));
  transition: transform 0.3s ease;
}

.control-group.is-open .group-chevron {
  transform: rotate(180deg);
}

.group-content {
  padding: 16px;
  border-top: 1px solid rgb(var(--border-primary));
}
</style> 