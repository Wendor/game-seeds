<template>
  <header class="header">
    <button @click="$emit('back')" class="btn btn-secondary btn-sm back-btn">
      <span class="back-arrow">←</span> {{ t('game.menu') }}
    </button>
    <div class="timer" :class="{ finished: isGameOver }">⏱ {{ time }}</div>
    <div class="stats">{{ t('game.total') }}: <strong>{{ activeCount }}</strong></div>
  </header>
</template>

<script setup lang="ts">
import { useI18n } from '../composables/useI18n';

defineProps<{
  time: string;
  activeCount: number;
  isGameOver: boolean;
}>();

defineEmits(['back']);

const { t } = useI18n();
</script>

<style scoped>
/* Дополнительные стили, если нужно, или полагаемся на global css */
.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  line-height: 1;
  padding-bottom: 6px;
  padding-top: 6px;
}
.back-arrow {
  font-size: 1.1em;
}
</style>