<template>
  <section class="screen-leaderboard">
    <div class="leaderboard-card">
      <h2>{{ t('records.title') }}</h2>

      <div class="tabs">
        <button @click="activeTab = 'easy'" class="tab-btn" :class="{ active: activeTab === 'easy' }">
          {{ t('records.easy') }}
        </button>
        <button @click="activeTab = 'classic'" class="tab-btn" :class="{ active: activeTab === 'classic' }">
          {{ t('records.classic') }}
        </button>
        <button @click="activeTab = 'random'" class="tab-btn" :class="{ active: activeTab === 'random' }">
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

      <button @click="$emit('close')" class="btn btn-secondary btn-lg full-width">
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

h2 { text-align: center; margin-top: 0; color: var(--text-main); }

.tabs {
  display: flex; background: var(--btn-sec-bg); padding: 4px; border-radius: 12px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1; border: none; background: transparent; padding: 8px;
  border-radius: 8px; font-weight: 600; color: var(--text-muted); cursor: pointer;
  transition: all 0.2s;
}

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
</style>