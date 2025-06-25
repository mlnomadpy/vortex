# Shadcn UI Components

This directory contains Shadcn UI components for Vue.js that provide consistent, accessible design patterns.

## Button Component

The Button component is built using `class-variance-authority` for type-safe variant styling and provides multiple appearances and sizes.

### Basic Usage

```vue
<template>
  <Button>Click me</Button>
</template>

<script setup>
import { Button } from '@/components/ui'
</script>
```

### Variants

- `default` - Primary blue button (default)
- `secondary` - Gray secondary button
- `destructive` - Red destructive button for dangerous actions
- `outline` - Outlined button with transparent background
- `ghost` - Minimal button with no background
- `link` - Text button that looks like a link

```vue
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

### Sizes

- `sm` - Small button
- `default` - Default size (default)
- `lg` - Large button
- `icon` - Square button for icons

```vue
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <IconComponent />
</Button>
```

### Custom Styling

You can add custom classes while maintaining the variant styles:

```vue
<Button class="w-full">Full Width</Button>
<Button class="bg-gradient-to-r from-purple-500 to-pink-500">Custom Colors</Button>
```

### With Icons

```vue
<Button>
  <PlusIcon class="mr-2 h-4 w-4" />
  Add Item
</Button>
```

### Loading State

```vue
<template>
  <Button :disabled="isLoading" @click="handleClick">
    <LoadingSpinner v-if="isLoading" class="mr-2 h-4 w-4" />
    {{ isLoading ? 'Loading...' : 'Submit' }}
  </Button>
</template>

<script setup>
import { ref } from 'vue'

const isLoading = ref(false)

function handleClick() {
  isLoading.value = true
  // Perform async operation
}
</script>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Button appearance variant |
| `size` | `'sm' \| 'default' \| 'lg' \| 'icon'` | `'default'` | Button size |
| `as` | `string` | `'button'` | HTML element to render |
| `class` | `string` | - | Additional CSS classes |

All other props are passed through to the underlying element.

## Installation

The Button component depends on:
- `class-variance-authority` - For type-safe variant handling
- `clsx` - For conditional class names
- `tailwind-merge` - For merging Tailwind classes safely

These are already installed in this project. 