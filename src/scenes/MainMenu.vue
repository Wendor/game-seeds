<template>
  <section class="screen-menu">
    <div class="settings-group">
      <button class="icon-btn" @click="toggleLanguage" title="Switch Language">
        {{ currentLang === 'ru' ? 'EN' : 'RU' }}
      </button>
      <button class="icon-btn" @click="toggleSound" :title="isMuted ? 'Включить звук' : 'Выключить звук'">
        {{ isMuted ? '🔇' : '🔊' }}
      </button>
      <button class="icon-btn" @click="$emit('toggle-theme')" title="Переключить тему">
        {{ isDark ? '🌙' : '☀️' }}
      </button>
    </div>

    <div class="menu-content">
      <h1 class="game-title">{{ t('menu.title') }}</h1>
      <p class="game-subtitle">{{ t('menu.subtitle') }}</p>
      
      <div class="menu-buttons">
        <button v-if="hasSave" @click="$emit('continue')" class="btn btn-success btn-xl continue-btn">
          ▶ {{ t('menu.resume') }}
          <span class="save-info">{{ saveInfo }}</span>
        </button>

        <button @click="$emit('start', 'easy')" class="btn btn-easy btn-xl">
          {{ t('menu.easy') }}
        </button>

        <button @click="$emit('start', 'classic')" class="btn btn-primary btn-xl">
          {{ t('menu.classic') }}
        </button>
        <button @click="$emit('start', 'random')" class="btn btn-primary btn-xl">
          {{ t('menu.random') }}
        </button>
        
        <button v-if="canInstall" @click="installApp" class="btn btn-primary btn-xl install-btn">
          {{ t('menu.install') }}
        </button>

        <button @click="$emit('open-leaderboard')" class="btn btn-secondary btn-lg">
          {{ t('menu.records') }}
        </button>

        <button @click="$emit('open-rules')" class="btn btn-secondary btn-lg">
          {{ t('menu.rules') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { GameMode, SavedGameState } from '../types';
import { toggleMute, getMuteState } from '../utils/audio';
import { useI18n } from '../composables/useI18n';

const { t, toggleLanguage, currentLang } = useI18n();

defineProps<{ isDark: boolean }>();

defineEmits<{
  (e: 'start', mode: GameMode): void;
  (e: 'continue'): void;
  (e: 'open-rules'): void;
  (e: 'open-leaderboard'): void;
  (e: 'toggle-theme'): void;
}>();

const hasSave = ref(false);
const saveInfo = ref('');
const isMuted = ref(false);

const toggleSound = () => {
  isMuted.value = toggleMute();
};

onMounted(() => {
  const savedData = localStorage.getItem('seeds-save');
  if (savedData) {
    try {
      const parsed: SavedGameState = JSON.parse(savedData);
      hasSave.value = true;
      
      const m = Math.floor(parsed.time / 60).toString().padStart(2, '0');
      const s = (parsed.time % 60).toString().padStart(2, '0');
      const timeStr = `${m}:${s}`;
      
      let modeName = parsed.mode === 'random' ? 'Random' : (parsed.mode === 'easy' ? 'Lite' : 'Classic');
      
      saveInfo.value = t('menu.saveInfo', { mode: modeName, time: timeStr });
    } catch { hasSave.value = false; }
  }
  isMuted.value = getMuteState();
  window.addEventListener('beforeinstallprompt', handleInstallPrompt);
});

// PWA
const canInstall = ref(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deferredPrompt: any = null;
const handleInstallPrompt = (e: Event) => { e.preventDefault(); deferredPrompt = e; canInstall.value = true; };
const installApp = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { deferredPrompt = null; canInstall.value = false; } };
onBeforeUnmount(() => { window.removeEventListener('beforeinstallprompt', handleInstallPrompt); });
</script>

<style scoped>
.screen-menu {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 20px;
  position: relative;
}

.settings-group {
  position: absolute;
  top: 20px; right: 20px;
  display: flex; gap: 10px;
}

.icon-btn {
  background: var(--card-bg);
  border: 1px solid var(--cell-border);
  font-size: 1.2rem;
  width: 44px; height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  transition: all 0.2s;
  color: var(--text-main);
}
.icon-btn:hover { transform: scale(1.1); }

.menu-content { text-align: center; max-width: 400px; width: 100%; }
.game-title { font-size: 3rem; font-weight: 800; color: #3b82f6; margin: 0; letter-spacing: -1px; }
.game-subtitle { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 40px; }
.menu-buttons { display: flex; flex-direction: column; gap: 16px; }

.install-btn { background: linear-gradient(90deg, #3b82f6, #2563eb); box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3); }

/* Стиль для кнопки Продолжить (Зеленый) */
.btn-success {
  background-color: #10b981; color: white;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
  display: flex; flex-direction: column; align-items: center; line-height: 1.2;
}
.btn-success:hover { background-color: #059669; }

/* ОБНОВЛЕННЫЙ СТИЛЬ: Кнопка Лайт (Оранжевый/Желтый) */
.btn-easy {
  background-color: #f59e0b; /* Amber-500 */
  color: white;
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
}
.btn-easy:hover { 
  background-color: #d97706; /* Amber-600 */
}

.save-info { font-size: 0.85rem; opacity: 0.9; font-weight: 400; margin-top: 2px; }

@media (min-width: 768px) {
  .screen-menu { background: var(--bg-main); }
  .menu-content { 
    background: var(--card-bg);
    padding: 40px; border-radius: 24px; 
    box-shadow: 0 20px 40px -5px var(--shadow-color);
  }
}
</style>