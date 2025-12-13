<template>
  <div class="app-wrapper" :class="{ dark: isDark }">
    <Transition :name="transitionName" mode="out-in">
      
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
        @back="goBack" 
        @play="handleStartLevel"
      />

      <Rules 
        v-else-if="currentScreen === 'rules'" 
        @close="goBack"
      />
      
      <Leaderboard
        v-else-if="currentScreen === 'leaderboard'"
        @close="goBack"
      />

      <Game 
        v-else 
        :mode="activeGameMode" 
        :resume="isResumeGame"
        :level-config="activeLevelConfig"
        :key="gameKey"
        @back="handleGameBack"
        @restart="handleRestart"
        @next-level="handleStartLevel" 
      />
      
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import MainMenu from './scenes/MainMenu.vue';
import Game from './scenes/Game.vue';
import Levels from './scenes/Levels.vue';
import Rules from './scenes/Rules.vue';
import Leaderboard from './scenes/Leaderboard.vue';
import { useI18n } from './composables/useI18n';
import type { GameMode, LevelConfig, ScreenName } from './types';

// Карта глубины экранов (0 - самый верхний уровень)
const SCREEN_DEPTH: Record<ScreenName, number> = {
  menu: 0,
  levels: 1,
  rules: 1,
  leaderboard: 1,
  game: 2
};

// Состояние
const currentScreen = ref<ScreenName>('menu');
const isDark = ref(false);
const activeGameMode = ref<GameMode>('classic');
const isResumeGame = ref(false);
const gameKey = ref(0);
const activeLevelConfig = ref<LevelConfig | undefined>(undefined);
const transitionName = ref('fade');

const { initLanguage } = useI18n();

// --- ЛОГИКА КНОПКИ НАЗАД (HISTORY API) ---

const isPopState = ref(false);

const handlePopState = (event: PopStateEvent) => {
  isPopState.value = true;
  if (event.state && event.state.screen) {
    currentScreen.value = event.state.screen;
  } else {
    currentScreen.value = 'menu';
  }
  nextTick(() => {
    isPopState.value = false;
  });
};

const goBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    currentScreen.value = 'menu';
  }
};

watch(currentScreen, (newScreen, oldScreen) => {
  const newDepth = SCREEN_DEPTH[newScreen] || 0;
  const oldDepth = SCREEN_DEPTH[oldScreen as ScreenName] || 0;

  if (newDepth > oldDepth) {
    transitionName.value = 'slide-left';
  } else if (newDepth < oldDepth) {
    transitionName.value = 'slide-right';
  } else {
    transitionName.value = 'fade';
  }

  if (!isPopState.value && newScreen !== 'menu') {
    window.history.pushState({ screen: newScreen }, '');
  }
});

// --- ЛОГИКА ИГРЫ ---

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
};

const handleStartGame = (mode: GameMode) => {
  activeGameMode.value = mode;
  isResumeGame.value = false;
  if (mode !== 'levels') activeLevelConfig.value = undefined;
  gameKey.value++;
  currentScreen.value = 'game';
};

const handleContinueGame = () => {
  isResumeGame.value = true;
  gameKey.value++;
  currentScreen.value = 'game';
};

const handleStartLevel = (config: LevelConfig) => {
  activeLevelConfig.value = config;
  handleStartGame('levels');
};

const handleRestart = () => {
  isResumeGame.value = false;
  gameKey.value++;
};

const handleGameBack = () => {
  goBack();
};

onMounted(() => {
  const savedTheme = localStorage.getItem('seeds-theme');
  if (savedTheme) {
    isDark.value = savedTheme === 'dark';
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  updateBodyClass();

  initLanguage();

  if (!window.history.state) {
    window.history.replaceState({ screen: 'menu' }, '');
  }
  window.addEventListener('popstate', handlePopState);
});

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState);
});
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

/* --- АНИМАЦИЯ ПЕРЕХОДОВ (БАЗОВАЯ) --- */
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

/* --- ДОБАВЛЕНО: АНИМАЦИИ НАВИГАЦИИ (СЛАЙДЫ) --- */
/* Slide Left (Вход ВПЕРЕД) */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Slide Right (Вход НАЗАД) */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
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

<style scoped>
.app-container {
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>