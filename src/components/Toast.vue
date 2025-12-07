<template>
  <Transition name="toast">
    <div v-if="show" class="toast-wrapper">
      <div class="toast-content">
        {{ message }}
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  message: string;
}>();
</script>

<style scoped>
.toast-wrapper {
  position: fixed;
  top: 80px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

.toast-content {
  /* Используем темный фон из переменных (например, Slate-800 или 900) */
  background-color: rgb(30, 41, 59); /* Slate-800 */
  color: rgb(var(--rgb-white));
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-size: 0.95rem;
  pointer-events: auto;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}
</style>