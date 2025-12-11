<template>
  <footer class="controls">
    <button 
      @click="$emit('undo')" 
      class="btn btn-secondary btn-icon icon-text" 
      :disabled="!canUndo || isGameOver || isBotActive" 
      :title="t('game.undo')"
    >
      ⤺
    </button>
    
    <button 
      @click="$emit('hint')" 
      class="btn btn-secondary btn-icon icon-text" 
      :disabled="isGameOver || isBotActive" 
      :title="t('game.hint')"
    >
      ⚐
    </button>
    
    <button 
      @click="$emit('add')" 
      :disabled="isGameOver || isBotActive" 
      class="btn btn-primary btn-lg"
    >
      {{ t('game.add') }}
    </button>
    
    <button 
      @click="$emit('toggle-bot')" 
      class="btn btn-icon" 
      :class="isBotActive ? 'btn-danger' : 'btn-secondary'" 
      :disabled="isGameOver" 
      :title="t('game.auto')"
    >
      <svg v-if="isBotActive" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>
    </button>
    
    <button 
      @click="$emit('restart')" 
      class="btn btn-secondary btn-icon" 
      :title="t('game.restart')"
    >
      ↺
    </button>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from '../composables/useI18n';

defineProps<{
  canUndo: boolean;
  isGameOver: boolean;
  isBotActive: boolean;
}>();

defineEmits(['undo', 'hint', 'add', 'toggle-bot', 'restart']);

const { t } = useI18n();
</script>

<style scoped>
.icon-text {
  font-size: 1.6rem;
  line-height: 1;
  padding-bottom: 2px;
}
</style>