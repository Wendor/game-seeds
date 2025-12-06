<template>
  <div class="app-wrapper" :class="{ dark: isDark }">
    <MainMenu 
      v-if="currentScreen === 'menu'" 
      :is-dark="isDark"
      @toggle-theme="toggleTheme"
      @start="handleStartGame"
      @continue="handleContinueGame" 
      @open-rules="currentScreen = 'rules'"
      @open-leaderboard="currentScreen = 'leaderboard'"
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
      :key="gameKey"
      @back="currentScreen = 'menu'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MainMenu from './scenes/MainMenu.vue';
import Rules from './scenes/Rules.vue';
import Game from './scenes/Game.vue';
import Leaderboard from './scenes/Leaderboard.vue';
import type { GameMode } from './types';
import { useI18n } from './composables/useI18n';

const { initLanguage } = useI18n();
initLanguage();

type ScreenType = 'menu' | 'rules' | 'game' | 'leaderboard';

const currentScreen = ref<ScreenType>('menu');
const activeGameMode = ref<GameMode>('classic');
const isResumeGame = ref(false);

// --- ТЕМНАЯ ТЕМА ---
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
// -------------------

const gameKey = computed(() => `${activeGameMode.value}-${isResumeGame.value}-${Date.now()}`);

const handleStartGame = (mode: GameMode) => {
  activeGameMode.value = mode;
  isResumeGame.value = false;
  currentScreen.value = 'game';
};

const handleContinueGame = () => {
  isResumeGame.value = true;
  currentScreen.value = 'game';
};
</script>

<style>
/* === ГЛОБАЛЬНЫЕ ЦВЕТОВЫЕ ПЕРЕМЕННЫЕ === */
:root {
  /* Светлая тема (default) */
  --bg-main: #ffffff;
  --bg-secondary: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); /* Фон меню */
  --text-main: #1f2937;
  --text-muted: #64748b;
  
  --cell-bg: #f9fafb;
  --cell-border: #e5e7eb;
  --cell-text: #111827;
  
  --header-bg: rgba(255, 255, 255, 0.95);
  --border-color: #f3f4f6;
  
  --btn-sec-bg: #f3f4f6;
  --btn-sec-text: #4b5563;
  --btn-sec-hover: #e5e7eb;
  
  --card-bg: #ffffff;
  --shadow-color: rgba(0,0,0,0.1);
}

/* Темная тема (переопределение) */
body.dark-mode {
  --bg-main: #0f172a; /* Темно-синий фон */
  --bg-secondary: #0f172a; 
  --text-main: #f1f5f9;
  --text-muted: #94a3b8;
  
  --cell-bg: #1e293b;
  --cell-border: #334155;
  --cell-text: #e2e8f0;
  
  --header-bg: rgba(15, 23, 42, 0.95);
  --border-color: #1e293b;
  
  --btn-sec-bg: #1e293b;
  --btn-sec-text: #cbd5e1;
  --btn-sec-hover: #334155;
  
  --card-bg: #1e293b;
  --shadow-color: rgba(0,0,0,0.5);
}

*, *::before, *::after {
  box-sizing: border-box;
}

body { margin: 0; padding: 0; background-color: var(--bg-main); transition: background-color 0.3s; }

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--bg-main); 
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--text-main);
  transition: background-color 0.3s, color 0.3s;
  overflow-x: hidden;
}

/* UI KIT (Кнопки) */
.btn { border: none; border-radius: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; font-family: inherit; text-decoration: none; }
.btn:active { transform: scale(0.96); }
.btn-sm { padding: 6px 12px; font-size: 0.9rem; }
.btn-lg { padding: 14px 24px; font-size: 1.1rem; }
.btn-xl { padding: 18px 24px; font-size: 1.2rem; width: 100%; }
.btn-icon { width: 52px; font-size: 1.4rem; padding: 0; flex: 0 0 auto; }

.btn-primary { background-color: #3b82f6; color: white; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2); }
.btn-primary:hover { background-color: #2563eb; }
.btn-primary:disabled { background-color: #9ca3af; box-shadow: none; opacity: 0.7; }

/* Вторичные кнопки теперь используют переменные */
.btn-secondary { background-color: var(--btn-sec-bg); color: var(--btn-sec-text); border: 1px solid transparent; }
.btn-secondary:hover { background-color: var(--btn-sec-hover); }
.btn-secondary:disabled { opacity: 0.5; }

body.dark-mode .btn-secondary { border-color: #334155; }
</style>