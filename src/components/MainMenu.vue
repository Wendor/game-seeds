<template>
  <section class="screen-menu">
    <div class="menu-content">
      <img src="/favicon.png" alt="Game Logo" width="256">
      <p class="game-subtitle">Логическая игра из детства</p>
      
      <div class="menu-buttons">
        <button @click="$emit('start', 'classic')" class="btn btn-primary btn-xl">
          Классика (1-19)
        </button>
        <button @click="$emit('start', 'random')" class="btn btn-primary btn-xl">
          Случайные числа
        </button>
        <button @click="$emit('open-rules')" class="btn btn-secondary btn-lg">
          📜 Правила игры
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// ВАЖНО: добавлено слово type
import type { GameMode } from '../types';

defineEmits<{
  (e: 'start', mode: GameMode): void;
  (e: 'open-rules'): void;
}>();
</script>

<style scoped>
.screen-menu {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}
.menu-content { text-align: center; max-width: 400px; width: 100%; }
.game-title { font-size: 3rem; font-weight: 800; color: #0369a1; margin: 0; letter-spacing: -1px; }
.game-subtitle { font-size: 1.1rem; color: #64748b; margin-bottom: 40px; }
.menu-buttons { display: flex; flex-direction: column; gap: 16px; }

@media (min-width: 768px) {
  .screen-menu { background: #f8fafc; }
  .menu-content { 
    background: white; padding: 40px; border-radius: 24px;
    box-shadow: 0 20px 40px -5px rgba(0,0,0,0.1);
  }
}
</style>