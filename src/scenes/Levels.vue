<template>
  <section class="screen-levels">
    <div class="levels-header">
      <button @click="$emit('back')" class="btn btn-secondary btn-icon back-btn">
        <span class="back-arrow">←</span>
      </button>
      <h2>Уровни</h2>
      <div class="spacer"></div>
    </div>

    <div class="levels-container" ref="containerRef">
      <div class="levels-grid">
        <div 
          v-for="(level, index) in levels" 
          :key="level.id" 
          class="level-item"
          :class="{ 'is-locked': isLocked(index) }"
        >
          <button 
            class="level-btn" 
            :disabled="isLocked(index)"
            @click="handlePlay(level, index)"
          >
            <template v-if="isLocked(index)">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lock-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </template>
            <span v-else class="level-number">{{ index + 1 }}</span>
          </button>
          
          <div class="stars-row" v-if="!isLocked(index)">
            <span 
              v-for="i in 3" 
              :key="i" 
              class="star-mini" 
              :class="{ filled: i <= getStars(level.id) }"
            >★</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { LEVELS } from '../data/levels';
import { useStatistics } from '../composables/useStatistics';
import type { LevelConfig } from '../types';

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'play', level: LevelConfig): void;
}>();

const { getLevelStars } = useStatistics();
const levels = LEVELS;

// --- ЛОГИКА СКРОЛЛА ---
const containerRef = ref<HTMLElement | null>(null);
const SCROLL_KEY = 'seeds-levels-scroll-pos';

onMounted(() => {
  const savedPos = sessionStorage.getItem(SCROLL_KEY);
  if (savedPos && containerRef.value) {
    containerRef.value.scrollTop = parseInt(savedPos, 10);
  }
});

onBeforeUnmount(() => {
  if (containerRef.value) {
    sessionStorage.setItem(SCROLL_KEY, String(containerRef.value.scrollTop));
  }
});
// ----------------------

const getStars = (id: string) => getLevelStars(id);

const isLocked = (index: number) => {
  if (index === 0) return false;
  
  const prevLevel = levels[index - 1];
  if (!prevLevel) return true;

  const prevStars = getLevelStars(prevLevel.id);
  return prevStars === 0;
};

const handlePlay = (level: LevelConfig, index: number) => {
  if (isLocked(index)) return;
  emit('play', level);
};
</script>

<style scoped>
.screen-levels {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-main);
  height: 100%;
}

.levels-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--header-bg);
  box-shadow: 0 4px 10px var(--shadow-color);
  z-index: 10;
}

.levels-header h2 { margin: 0; font-size: 1.5rem; color: var(--text-main); }
.spacer { width: 44px; }

.back-btn {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
}
.back-arrow { font-size: 1.4rem; padding-bottom: 4px; }

.levels-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex; 
  justify-content: center; 
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 16px 12px;
  width: 100%;
  max-width: 500px;
  align-content: start;
}

.level-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 100px; 
}

/* --- СТИЛИ КНОПКИ УРОВНЯ (ФИОЛЕТОВАЯ ТЕМА) --- */
.level-btn {
  width: 100%;
  aspect-ratio: 1;
  border: none;
  border-radius: 16px;
  
  /* Фиолетовый оттенок по умолчанию */
  background-color: rgba(var(--rgb-violet), 0.08); 
  border: 1px solid rgba(var(--rgb-violet), 0.3);
  color: var(--text-main);
  box-shadow: 0 4px 0 rgba(var(--rgb-violet), 0.2);
  
  font-size: 1.8rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
  position: relative;
}

.level-btn:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 0 0 rgba(var(--rgb-violet), 0.2);
}

/* Заблокированный уровень - остается серым */
.level-btn:disabled {
  background-color: var(--btn-sec-bg);
  color: var(--text-muted);
  box-shadow: none;
  border-color: transparent;
  cursor: not-allowed;
  opacity: 0.6;
}

.lock-icon {
  width: 28px;
  height: 28px;
  opacity: 0.5;
}

.stars-row {
  display: flex;
  gap: 2px;
  padding-top: 2px;
}

.star-mini {
  font-size: 20px;
  color: var(--text-muted);
  opacity: 0.1;
  line-height: 1;
}

.star-mini.filled {
  color: rgb(var(--rgb-yellow));
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
  opacity: 1;
}

/* --- DARK MODE --- */
body.dark-mode .level-btn {
  /* Более светлый фиолетовый текст и фон для темной темы */
  background-color: rgba(var(--rgb-violet), 0.15);
  border-color: rgba(var(--rgb-violet), 0.4);
  box-shadow: 0 4px 0 rgba(var(--rgb-violet), 0.25);
}

body.dark-mode .level-btn:active:not(:disabled) {
  box-shadow: none;
}

body.dark-mode .level-btn:disabled {
  background-color: var(--btn-sec-bg);
  border-color: transparent;
  box-shadow: none;
}

body.dark-mode .star-mini { color: var(--text-main); }
body.dark-mode .star-mini.filled { color: rgb(var(--rgb-yellow)); }
</style>