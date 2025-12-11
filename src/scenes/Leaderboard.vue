<template>
  <section class="screen-leaderboard">
    <div class="leaderboard-card">
      <h2>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="title-icon"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        {{ t('stats.title') }}
      </h2>

      <div class="tabs">
        <button @click="activeTab = 'easy'" class="tab-btn" :class="{ active: activeTab === 'easy' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>
          {{ t('stats.easy') }}
        </button>
        <button @click="activeTab = 'classic'" class="tab-btn" :class="{ active: activeTab === 'classic' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
          {{ t('stats.classic') }}
        </button>
        <button @click="activeTab = 'random'" class="tab-btn" :class="{ active: activeTab === 'random' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 8h.01"></path><path d="M8 8h.01"></path><path d="M8 16h.01"></path><path d="M16 16h.01"></path><path d="M12 12h.01"></path></svg>
          {{ t('stats.random') }}
        </button>
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-value">{{ currentStats.started }}</div>
          <div class="stat-label">{{ t('stats.played') }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ currentStats.won }}</div>
          <div class="stat-label">{{ t('stats.won') }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">{{ currentStats.winRate }}%</div>
          <div class="stat-label">{{ t('stats.rate') }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value text-green">{{ currentStats.bestTime }}</div>
          <div class="stat-label">{{ t('stats.best') }}</div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="records-list">
        <div v-if="currentRecords.length === 0" class="empty-state">
          {{ t('stats.empty') }}
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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        {{ t('stats.back') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { GameMode, GameRecord } from '../types';
import { useI18n } from '../composables/useI18n';
import { useStatistics, type StatsData } from '../composables/useStatistics';

const { t, currentLang } = useI18n();
const { getStats } = useStatistics();
defineEmits(['close']);

const activeTab = ref<GameMode>('easy');
const allRecords = ref<GameRecord[]>([]);
const generalStats = ref<StatsData>({ easy: { started: 0 }, classic: { started: 0 }, random: { started: 0 } });

onMounted(() => {
  const data = localStorage.getItem('seeds-records');
  if (data) {
    try { allRecords.value = JSON.parse(data); } catch (e) { console.error(e); }
  }
  generalStats.value = getStats();
});

const currentRecords = computed(() => {
  return allRecords.value
    .filter(r => r.mode === activeTab.value)
    .sort((a, b) => a.time - b.time)
    .slice(0, 10);
});

const currentStats = computed(() => {
  const mode = activeTab.value;
  const started = generalStats.value[mode]?.started || 0;
  
  const modeRecords = allRecords.value.filter(r => r.mode === mode);
  const won = modeRecords.length;
  
  const winRate = Math.min(100, started > 0 ? Math.round((won / started) * 100) : 0);
  
  let bestTime = '—';
  if (modeRecords.length > 0) {
    const minTime = Math.min(...modeRecords.map(r => r.time));
    bestTime = formatTime(minTime);
  }

  return { started, won, winRate, bestTime };
});

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
  text-align: center; margin-top: 0; color: var(--text-main);
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.title-icon { color: rgb(var(--rgb-blue)); }

.tabs {
  display: flex; 
  background: var(--btn-sec-bg); 
  padding: 4px; border-radius: 12px;
  margin-bottom: 20px;
  overflow-x: auto;
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

.tab-btn.active { 
  background: var(--card-bg); 
  color: rgb(var(--rgb-blue)); 
  box-shadow: 0 2px 4px var(--shadow-color); 
}

body.dark-mode .tabs {
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

body.dark-mode .tab-btn.active {
  background-color: rgb(var(--rgb-slate-700));
  color: rgb(var(--rgb-blue-400));
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

body.dark-mode .tab-btn:not(.active):hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-box {
  background: var(--btn-sec-bg);
  border-radius: 16px;
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

body.dark-mode .stat-box {
  background-color: rgba(0, 0, 0, 0.2);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
}
.stat-value.text-green { color: rgb(var(--rgb-green)); }

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 0 0 10px 0;
}

.records-list { flex: 1; overflow-y: auto; margin-bottom: 20px; min-height: 150px; }
.empty-state { text-align: center; color: var(--text-muted); margin-top: 30px; }

.record-item {
  display: flex; align-items: center; padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
}
.record-item:last-child { border-bottom: none; }

.rank {
  font-size: 1.1rem; font-weight: 800; width: 36px;
  color: rgb(var(--rgb-slate-300));
}
.record-item:nth-child(1) .rank { color: rgb(var(--rgb-yellow)); }
.record-item:nth-child(2) .rank { color: rgb(var(--rgb-slate-400)); }
.record-item:nth-child(3) .rank { color: rgb(var(--rgb-bronze)); }

.info { display: flex; flex: 1; justify-content: space-between; align-items: baseline; }
.time { font-size: 1.1rem; font-weight: 700; color: var(--text-main); }
.date { font-size: 0.85rem; color: var(--text-muted); }

.full-width { width: 100%; }
.btn-back { display: flex; align-items: center; justify-content: center; gap: 8px; }
</style>