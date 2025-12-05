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
  top: 80px; /* Чуть ниже шапки */
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 100;
  pointer-events: none; /* Чтобы сквозь него можно было кликать, если он прозрачный */
}

.toast-content {
  background-color: #1e293b;
  color: white;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-size: 0.95rem;
  pointer-events: auto;
}

/* Анимация появления/исчезновения */
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