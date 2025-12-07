<template>
  <Transition name="modal">
    <div v-if="show" class="modal-backdrop" @click.self="$emit('cancel')">
      <div class="modal-card">
        <h3 class="modal-title">{{ title }}</h3>
        <p class="modal-text">{{ message }}</p>
        
        <div class="modal-actions">
          <button @click="$emit('cancel')" class="btn btn-secondary btn-md">
            {{ cancelText }}
          </button>
          <button @click="$emit('confirm')" class="btn btn-primary btn-md">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}>();

defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--modal-overlay);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  text-align: center;
}

.modal-title {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  color: var(--text-main);
}

.modal-text {
  margin: 0 0 24px 0;
  color: var(--text-muted);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-md {
  padding: 10px 20px;
  font-size: 1rem;
  border-radius: 12px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  transform: scale(0.95) translateY(10px);
}
</style>