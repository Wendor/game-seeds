<template>
  <section class="screen-leaderboard">
    <div class="leaderboard-card">
      <h2>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="title-icon"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
        {{ t('records.title') }}
      </h2>

      <div class="tabs">
        <button @click="activeTab = 'easy'" class="tab-btn" :class="{ active: activeTab === 'easy' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>
          {{ t('records.easy') }}
        </button>
        <button @click="activeTab = 'classic'" class="tab-btn" :class="{ active: activeTab === 'classic' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
          {{ t('records.classic') }}
        </button>
        <button @click="activeTab = 'random'" class="tab-btn" :class="{ active: activeTab === 'random' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 8h.01"></path><path d="M8 8h.01"></path><path d="M8 16h.01"></path><path d="M16 16h.01"></path><path d="M12 12h.01"></path></svg>
          {{ t('records.random') }}
        </button>
      </div>

      <div class="records-list">
        <div v-if="currentRecords.length === 0" class="empty-state">
          {{ t('records.empty') }}
        </div>
        
        <div 
          v-else 
          v-for="(rec, index) in currentRecords" 
          :key="rec.date" 
          class="record-item"
        >
          <div class="rank">#{{ index + 1 }}</div>
          <div class="info">
            <div class="time">{{ formatTime(rec.time) }}</div>
            <div class="date">{{ formatDate(rec.date) }}</div>
          </div>
        </div>
      </div>

      <button @click="$emit('close')" class="btn btn-secondary btn-lg full-width btn-back">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        {{ t('records.back') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { GameMode, GameRecord } from '../types';
import { useI18n } from '../composables/useI18n';

const { t, currentLang } = useI18n();
defineEmits(['close']);

const activeTab = ref<GameMode>('easy');
const allRecords = ref<GameRecord[]>([]);

// Загружаем данные при открытии
onMounted(() => {
  const data = localStorage.getItem('seeds-records');
  if (data) {
    try {
      allRecords.value = JSON.parse(data);
    } catch (e) {
      console.error('Ошибка чтения рекордов', e);
    }
  }
});

// Фильтруем и сортируем (лучшее время сверху)
const currentRecords = computed(() => {
  return allRecords.value
    .filter(r => r.mode === activeTab.value)
    .sort((a, b) => a.time - b.time)
    .slice(0, 10); // Показываем только топ-10
});

// Форматирование времени (95 -> 01:35)
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const formatDate = (ts: number) => {
  return new Date(ts).toLocaleDateString(currentLang.value === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric', month: 'short'
  });
};
</script>

<style scoped>
.screen-leaderboard {
  flex: 1; display: flex; justify-content: center; padding: 20px;
  background: var(--bg-main);
}

.leaderboard-card {
  background: var(--card-bg); 
  padding: 30px; border-radius: 24px;
  width: 100%; max-width: 450px;
  box-shadow: 0 10px 30px -5px var(--shadow-color);
  display: flex; flex-direction: column;
}

h2 { 
  text-align: center; margin-top: 0; 
  color: var(--text-main);
  display: flex; align-items: center; justify-content: center; gap: 10px;
}

.title-icon { color: #eab308; } /* Золотой цвет для кубка */

.tabs {
  display: flex; background: var(--btn-sec-bg); padding: 4px; border-radius: 12px;
  margin-bottom: 20px;
  overflow-x: auto; /* На всякий случай для маленьких экранов */
}

.tab-btn {
  flex: 1; border: none; background: transparent; padding: 10px 8px;
  border-radius: 8px; font-weight: 600; color: var(--text-muted); cursor: pointer;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 0.9rem;
  white-space: nowrap;
}

.tab-icon { opacity: 0.7; }
.tab-btn.active .tab-icon { opacity: 1; }

.tab-btn.active { background: var(--card-bg); color: #3b82f6; box-shadow: 0 2px 4px var(--shadow-color); }

.records-list { flex: 1; overflow-y: auto; margin-bottom: 20px; min-height: 200px; }

.empty-state { text-align: center; color: var(--text-muted); margin-top: 40px; }

.record-item {
  display: flex; align-items: center; padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}
.record-item:last-child { border-bottom: none; }

.rank {
  font-size: 1.2rem; font-weight: 800; color: #cbd5e1; width: 40px;
}
.record-item:nth-child(1) .rank { color: #eab308; } /* Золото */
.record-item:nth-child(2) .rank { color: #94a3b8; } /* Серебро */
.record-item:nth-child(3) .rank { color: #b45309; } /* Бронза */

.info { display: flex; flex: 1; justify-content: space-between; align-items: baseline; }
.time { font-size: 1.1rem; font-weight: 700; color: var(--text-main); }
.date { font-size: 0.85rem; color: var(--text-muted); }

.full-width { width: 100%; }

.btn-back {
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
</style>