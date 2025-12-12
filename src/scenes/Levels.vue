<template>
  <section class="screen-levels">
    <div class="levels-header">
      <button @click="$emit('back')" class="btn btn-secondary btn-icon back-btn">
        ←
      </button>
      <h2>Фигуры</h2>
      <div class="spacer"></div>
    </div>

    <div class="levels-grid">
      <div 
        v-for="level in levels" 
        :key="level.id" 
        class="level-card"
        @click="$emit('play', level)"
      >
        <div class="level-preview">
          <span class="level-icon">🧩</span>
        </div>
        <div class="level-info">
          <div class="level-name">{{ level.name }}</div>
          <div class="stars-container">
            <span 
              v-for="i in 3" 
              :key="i" 
              class="star" 
              :class="{ filled: i <= getStars(level.id) }"
            >★</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { LEVELS } from '../data/levels';
import { useStatistics } from '../composables/useStatistics';
import type { LevelConfig } from '../types';

defineEmits<{
  (e: 'back'): void;
  (e: 'play', level: LevelConfig): void;
}>();

const { getLevelStars } = useStatistics();
const levels = LEVELS;

const getStars = (id: string) => getLevelStars(id);
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
  padding: 20px;
  background: var(--header-bg);
  box-shadow: 0 4px 10px var(--shadow-color);
  z-index: 10;
}

.levels-header h2 { margin: 0; font-size: 1.5rem; color: var(--text-main); }
.spacer { width: 44px; } /* Балансирует кнопку назад */

.levels-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  align-content: start;
}

.level-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 12px var(--shadow-color);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}

.level-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px var(--shadow-color);
  border-color: rgb(var(--rgb-blue));
}

.level-preview {
  background: var(--btn-sec-bg);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 2rem;
}

.level-name {
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
  font-size: 1rem;
}

.stars-container {
  display: flex;
  gap: 4px;
  justify-content: center;
  background: rgba(0,0,0,0.05);
  padding: 4px 8px;
  border-radius: 12px;
}

.star {
  font-size: 1.2rem;
  color: #ccc; /* Пустая звезда */
  line-height: 1;
  transition: color 0.3s;
}

.star.filled {
  color: rgb(var(--rgb-yellow));
  filter: drop-shadow(0 2px 0px rgba(0,0,0,0.1));
}

body.dark-mode .star { color: #444; }
body.dark-mode .star.filled { color: rgb(var(--rgb-yellow)); }
</style>