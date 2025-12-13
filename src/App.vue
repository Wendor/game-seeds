<template>
  <div class="app-wrapper" :class="{ dark: isDark }">
    <Transition name="fade" mode="out-in">
      
      <MainMenu 
        v-if="currentScreen === 'menu'" 
        :is-dark="isDark"
        @toggle-theme="toggleTheme"
        @start="handleStartGame"
        @open-levels="currentScreen = 'levels'"
        @continue="handleContinueGame" 
        @open-rules="currentScreen = 'rules'"
        @open-leaderboard="currentScreen = 'leaderboard'"
      />

      <Levels 
        v-else-if="currentScreen === 'levels'"
        @back="currentScreen = 'menu'"
        @play="handleStartLevel"
      />

      <Rules 
        v-else-if="currentScreen === 'rules'" 
        @close="currentScreen = 'menu'"
      />
      
      <Leaderboard
        v-else-if="currentScreen === 'leaderboard'"
        @close="currentScreen = 'menu'"
      />

      <Game 
        v-else 
        :mode="activeGameMode" 
        :resume="isResumeGame"
        :level-config="activeLevelConfig"
        :key="gameKey"
        @back="handleGameBack"
        @restart="handleRestart"
      />
      
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MainMenu from './scenes/MainMenu.vue';
import Rules from './scenes/Rules.vue';
import Game from './scenes/Game.vue';
import Leaderboard from './scenes/Leaderboard.vue';
import Levels from './scenes/Levels.vue';
import type { GameMode, LevelConfig } from './types';
import { useI18n } from './composables/useI18n';
import { LEVELS } from './data/levels';
import { useDebug } from './composables/useDebug';

const { initLanguage } = useI18n();
const { initDebug } = useDebug();
initLanguage();
initDebug();

type ScreenType = 'menu' | 'rules' | 'game' | 'leaderboard' | 'levels';

const currentScreen = ref<ScreenType>('menu');
const activeGameMode = ref<GameMode>('classic');
const activeLevelConfig = ref<LevelConfig | undefined>(undefined);
const isResumeGame = ref(false);
const restartCounter = ref(0);

const isDark = ref(false);

const updateMetaThemeColor = (dark: boolean) => {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', dark ? '#0f172a' : '#ffffff');
  }
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('seeds-theme', isDark.value ? 'dark' : 'light');
  updateBodyClass();
};

const updateBodyClass = () => {
  if (isDark.value) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  updateMetaThemeColor(isDark.value);
};

onMounted(() => {
  const savedTheme = localStorage.getItem('seeds-theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  if (savedTheme === 'dark') {
    isDark.value = true;
  } else if (savedTheme === 'light') {
    isDark.value = false;
  } else {
    isDark.value = systemPrefersDark.matches;
  }
  
  updateBodyClass();

  systemPrefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('seeds-theme')) {
      isDark.value = e.matches;
      updateBodyClass();
    }
  });
});

const gameKey = computed(() => `${activeGameMode.value}-${restartCounter.value}`);

const handleStartGame = (mode: GameMode) => {
  activeGameMode.value = mode;
  activeLevelConfig.value = undefined;
  isResumeGame.value = false;
  restartCounter.value++;
  currentScreen.value = 'game';
};

const handleStartLevel = (level: LevelConfig) => {
  activeGameMode.value = 'levels';
  activeLevelConfig.value = level;
  isResumeGame.value = false;
  restartCounter.value++;
  currentScreen.value = 'game';
};

const handleContinueGame = () => {
  const savedData = localStorage.getItem('seeds-save');
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (parsed.mode) {
        activeGameMode.value = parsed.mode;
        
        if (parsed.mode === 'levels' && parsed.levelId) {
          activeLevelConfig.value = LEVELS.find(l => l.id === parsed.levelId);
        } else {
          activeLevelConfig.value = undefined;
        }
      }
    } catch (e) {
      console.error('Ошибка чтения сохранения', e);
    }
  }

  isResumeGame.value = true;
  currentScreen.value = 'game';
};

const handleRestart = () => {
  isResumeGame.value = false;
  restartCounter.value++;
};

// ОБРАБОТКА НАВИГАЦИИ НАЗАД
const handleGameBack = () => {
  if (activeGameMode.value === 'levels') {
    currentScreen.value = 'levels';
  } else {
    currentScreen.value = 'menu';
  }
};
</script>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  overscroll-behavior: none;
  height: 100%;
}

body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden; 
  background-color: var(--bg-main);
  transition: background-color 0.3s;
  
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
}

#app {
  height: 100%;
  width: 100%;
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-main); 
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--text-main);
  transition: background-color 0.3s, color 0.3s;
}

.screen-menu, .screen-rules, .screen-leaderboard {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* --- АНИМАЦИЯ ПЕРЕХОДОВ --- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

/* UI KIT (Кнопки) */
.btn { 
  border: none; 
  border-radius: 12px; 
  font-weight: 600; 
  cursor: pointer; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  transition: all 0.2s; 
  font-family: inherit; 
  text-decoration: none; 
}
.btn:active { transform: scale(0.96); }
.btn-sm { padding: 6px 12px; font-size: 0.9rem; }
.btn-lg { padding: 14px 24px; font-size: 1.1rem; }
.btn-xl { padding: 18px 24px; font-size: 1.2rem; width: 100%; }
.btn-icon { width: 52px; font-size: 1.4rem; padding: 0; flex: 0 0 auto; }

.btn-primary { 
  background-color: rgb(var(--rgb-blue)); 
  color: rgb(var(--rgb-white)); 
  box-shadow: 0 4px 6px -1px rgba(var(--rgb-blue), 0.2); 
}
.btn-primary:hover { 
  background-color: rgb(var(--rgb-blue-600));
}
.btn-primary:disabled { 
  background-color: rgb(var(--rgb-slate-400)); 
  box-shadow: none; 
  opacity: 0.7; 
}

.btn-secondary { 
  background-color: var(--btn-sec-bg); 
  color: var(--btn-sec-text); 
  border: 1px solid transparent; 
}
.btn-secondary:hover { 
  background-color: var(--btn-sec-hover); 
}
.btn-secondary:disabled { opacity: 0.5; }

body.dark-mode .btn-secondary { 
  border-color: rgb(var(--rgb-slate-700)); 
}
</style>