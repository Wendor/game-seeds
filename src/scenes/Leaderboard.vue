<template>
  <section class="screen-leaderboard">
    <div class="leaderboard-card">
      <h2>🏆 Рекорды</h2>

      <div class="tabs">
        <button 
          @click="activeTab = 'classic'" 
          class="tab-btn" 
          :class="{ active: activeTab === 'classic' }"
        >
          Классика
        </button>
        <button 
          @click="activeTab = 'random'" 
          class="tab-btn" 
          :class="{ active: activeTab === 'random' }"
        >
          Рандом
        </button>
      </div>

      <div class="records-list">
        <div v-if="currentRecords.length === 0" class="empty-state">
          Пока нет побед. Сыграем?
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
        Назад в меню
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { GameMode, GameRecord } from '../types';

defineEmits(['close']);

const activeTab = ref<GameMode>('classic');
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
  return new Date(ts).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short'
  });
};
</script>

<style scoped>
.screen-leaderboard {
  flex: 1; display: flex; justify-content: center; padding: 20px;
  background: #f8fafc;
}

.leaderboard-card {
  background: white; padding: 30px; border-radius: 24px;
  width: 100%; max-width: 450px;
  box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);
  display: flex; flex-direction: column;
}

h2 { text-align: center; margin-top: 0; color: #0f172a; }

.tabs {
  display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1; border: none; background: transparent; padding: 8px;
  border-radius: 8px; font-weight: 600; color: #64748b; cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active { background: white; color: #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.records-list { flex: 1; overflow-y: auto; margin-bottom: 20px; min-height: 200px; }

.empty-state { text-align: center; color: #94a3b8; margin-top: 40px; }

.record-item {
  display: flex; align-items: center; padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}
.record-item:last-child { border-bottom: none; }

.rank {
  font-size: 1.2rem; font-weight: 800; color: #cbd5e1; width: 40px;
}
.record-item:nth-child(1) .rank { color: #eab308; } /* Золото */
.record-item:nth-child(2) .rank { color: #94a3b8; } /* Серебро */
.record-item:nth-child(3) .rank { color: #b45309; } /* Бронза */

.info { display: flex; flex: 1; justify-content: space-between; align-items: baseline; }
.time { font-size: 1.1rem; font-weight: 700; color: #334155; }
.date { font-size: 0.85rem; color: #94a3b8; }

.full-width { width: 100%; }
</style>