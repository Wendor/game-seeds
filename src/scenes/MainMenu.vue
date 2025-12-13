<template>
  <section class="screen-menu">
    <Toast :show="!!toastMessage" :message="toastMessage || ''" />

    <div class="menu-wrapper">
      
      <div class="settings-group">
        <button class="icon-btn" @click="toggleLanguage" :title="t('menu.lang')">
          {{ currentLang === 'ru' ? 'EN' : 'RU' }}
        </button>
        <button class="icon-btn" @click="toggleSound" :title="isMuted ? t('menu.soundOn') : t('menu.soundOff')">
          <svg v-if="!isMuted" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
        </button>
        <button class="icon-btn" @click="$emit('toggle-theme')" :title="t('menu.theme')">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </button>
      </div>

      <div class="menu-content">
        <h1 class="game-title">{{ t('menu.title') }}</h1>
        <p class="game-subtitle">{{ t('menu.subtitle') }}</p>
        
        <div class="menu-buttons">
          <button v-if="hasSave" @click="$emit('continue')" class="btn btn-success btn-xl continue-btn">
            <div class="btn-row">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              {{ t('menu.resume') }}
            </div>
            <span class="save-info">{{ saveInfo }}</span>
          </button>

          <button @click="$emit('open-levels')" class="btn btn-levels btn-xl">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg">
               <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
               <circle cx="6" cy="18" r="3"></circle>
               <rect x="16" y="16" width="6" height="6" rx="1"></rect>
             </svg>
             {{ t('menu.levels') }}
          </button>

          <button @click="$emit('start', 'easy')" class="btn btn-easy btn-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>
            {{ t('menu.easy') }}
          </button>

          <button @click="$emit('start', 'classic')" class="btn btn-primary btn-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
            {{ t('menu.classic') }}
          </button>
          
          <button @click="$emit('start', 'random')" class="btn btn-primary btn-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 8h.01"></path><path d="M8 8h.01"></path><path d="M8 16h.01"></path><path d="M16 16h.01"></path><path d="M12 12h.01"></path></svg>
            {{ t('menu.random') }}
          </button>
          
          <button v-if="canInstall" @click="installApp" class="btn btn-primary btn-xl install-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            {{ t('menu.install') }}
          </button>

          <button @click="$emit('open-leaderboard')" class="btn btn-secondary btn-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            {{ t('menu.stats') }}
          </button>

          <button @click="$emit('open-rules')" class="btn btn-secondary btn-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            {{ t('menu.rules') }}
          </button>
        </div>
      </div>

      <div class="app-version" @click="handleVersionClick">build {{ appVersion }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import type { GameMode, SavedGameState } from '../types';
import { toggleMute, getMuteState } from '../utils/audio';
import { useI18n } from '../composables/useI18n';
import { useDebug } from '../composables/useDebug';
import { useFeedback } from '../composables/useFeedback';
import Toast from '../components/Toast.vue';
import { LEVELS } from '../data/levels';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const { t, toggleLanguage, currentLang } = useI18n();
const { enableDebug, isDebug } = useDebug();
const { toastMessage, showToast } = useFeedback();

const appVersion = __APP_VERSION__;

defineProps<{ isDark: boolean }>();

defineEmits<{
  (e: 'start', mode: GameMode): void;
  (e: 'continue'): void;
  (e: 'open-rules'): void;
  (e: 'open-leaderboard'): void;
  (e: 'open-levels'): void;
  (e: 'toggle-theme'): void;
}>();

const savedGame = ref<SavedGameState | null>(null);
const isMuted = ref(false);
const clickCount = ref(0);

const hasSave = computed(() => !!savedGame.value);

const saveInfo = computed(() => {
  if (!savedGame.value) return '';
  let modeText = '';

  if (savedGame.value.mode === 'levels' && savedGame.value.levelId) {
    const levelIndex = LEVELS.findIndex(l => l.id === savedGame.value!.levelId);
    if (levelIndex !== -1) {
      modeText = t('stats.level', { n: levelIndex + 1 });
    } else {
      modeText = t('stats.levels');
    }
  } else {
    let modeKey = 'stats.classic';
    if (savedGame.value.mode === 'random') modeKey = 'stats.random';
    if (savedGame.value.mode === 'easy') modeKey = 'stats.easy';
    modeText = t(modeKey);
  }

  const m = Math.floor(savedGame.value.time / 60).toString().padStart(2, '0');
  const s = (savedGame.value.time % 60).toString().padStart(2, '0');
  const timeStr = `${m}:${s}`;
  
  return t('menu.saveInfo', { mode: modeText, time: timeStr });
});

const handleVersionClick = () => {
  if (isDebug.value) return;

  clickCount.value++;
  if (clickCount.value >= 10) {
    const activated = enableDebug();
    if (activated) {
      showToast('Debug mode activated: Bot enabled');
    }
    clickCount.value = 0;
  }
};

const toggleSound = () => {
  isMuted.value = toggleMute();
};

onMounted(() => {
  const savedData = localStorage.getItem('seeds-save');
  if (savedData) {
    try {
      savedGame.value = JSON.parse(savedData);
    } catch { 
      savedGame.value = null; 
    }
  }
  isMuted.value = getMuteState();
  window.addEventListener('beforeinstallprompt', handleInstallPrompt);
});

// PWA
const canInstall = ref(false);
let deferredPrompt: BeforeInstallPromptEvent|null = null;
const handleInstallPrompt = (e: Event) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  canInstall.value = true;
};
const installApp = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { deferredPrompt = null; canInstall.value = false; } };
onBeforeUnmount(() => { window.removeEventListener('beforeinstallprompt', handleInstallPrompt); });
</script>

<style scoped>
.screen-menu {
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: flex-start; /* Ставим flex-start, чтобы контент мог скроллиться если не влазит */
  padding: 20px;
  position: relative;
  height: 100%;
  overflow-y: auto; /* Разрешаем скролл */
}

/* Обертка занимает всю высоту, чтобы растянуть элементы */
.menu-wrapper {
  min-height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* position: relative; - Убрали, чтобы настройки были привязаны к screen-menu */
}

.settings-group {
  /* Больше не absolute */
  display: flex; 
  gap: 10px;
  align-self: flex-end; /* Прижать вправо */
  margin-bottom: 20px;
  width: 100%;
  justify-content: flex-end;
}

.icon-btn {
  background: var(--card-bg);
  border: 1px solid var(--cell-border);
  font-size: 1rem;
  font-weight: 700;
  width: 44px; height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 10px var(--shadow-color);
  transition: all 0.2s;
  color: var(--text-main);
  padding: 0;
}
.icon-btn:hover { transform: scale(1.1); }

.menu-content { 
  text-align: center; max-width: 400px; width: 100%; 
  margin-top: auto; /* Центрируем по вертикали */
  margin-bottom: auto;
  padding-top: 40px; /* Отступ от настроек, если экран маленький */
}

.game-title { 
  font-size: 3rem; 
  font-weight: 800; 
  color: rgb(var(--rgb-blue)); 
  margin: 0 0 10px 0; /* Добавил отступ снизу */
  letter-spacing: -1px; 
}

.game-subtitle { 
  font-size: 1.1rem; 
  color: var(--text-muted); 
  margin-bottom: 40px; 
}

.menu-buttons { display: flex; flex-direction: column; gap: 16px; }

/* ... стили кнопок без изменений ... */
.install-btn { 
  background: rgb(var(--rgb-blue));
  box-shadow: 0 4px 15px rgba(var(--rgb-blue), 0.3); 
}

.btn-success {
  background-color: rgb(var(--rgb-green)); 
  color: white;
  box-shadow: 0 4px 10px rgba(var(--rgb-green), 0.3);
  display: flex; flex-direction: column; align-items: center; line-height: 1.2;
}
.btn-success:hover { filter: brightness(0.9); }

.btn-row {
  display: flex; align-items: center; gap: 8px;
}

.btn-easy {
  background-color: rgb(var(--rgb-amber)); 
  color: white;
  box-shadow: 0 4px 10px rgba(var(--rgb-amber), 0.3);
}
.btn-easy:hover { filter: brightness(0.9); }

.btn-levels {
  background-color: rgb(var(--rgb-violet)); 
  color: white;
  box-shadow: 0 4px 10px rgba(var(--rgb-violet), 0.3);
}
.btn-levels:hover { filter: brightness(0.9); }

.save-info { font-size: 0.85rem; opacity: 0.9; font-weight: 400; margin-top: 2px; }

.btn-icon-svg {
  margin-right: 8px;
  margin-left: -4px; 
}

.app-version {
  margin-top: 30px;
  padding-bottom: 20px;
  font-size: 0.75rem;
  color: var(--text-muted);
  opacity: 0.5;
  font-family: monospace;
  cursor: default;
  user-select: none;
}

@media (min-width: 768px) {
  .screen-menu { background: var(--bg-main); }
  .menu-content { 
    background: var(--card-bg);
    padding: 40px; border-radius: 24px; 
    box-shadow: 0 20px 40px -5px var(--shadow-color);
    margin-top: 20px; /* Отступ сверху на десктопе */
  }
}
</style>