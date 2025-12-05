<template>
  <div class="app-wrapper">
    <MainMenu 
      v-if="currentScreen === 'menu'" 
      @start="handleStartGame"
      @open-rules="currentScreen = 'rules'"
    />

    <Rules 
      v-else-if="currentScreen === 'rules'" 
      @close="currentScreen = 'menu'"
    />

    <Game 
      v-else 
      :mode="activeGameMode" 
      :key="activeGameMode"
      @back="currentScreen = 'menu'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MainMenu from './components/MainMenu.vue';
import Rules from './components/Rules.vue';
import Game from './components/Game.vue';
// ВАЖНО: добавлено слово type
import type { GameMode } from './types';

type ScreenType = 'menu' | 'rules' | 'game';

const currentScreen = ref<ScreenType>('menu');
const activeGameMode = ref<GameMode>('classic');

const handleStartGame = (mode: GameMode) => {
  activeGameMode.value = mode;
  currentScreen.value = 'game';
};
</script>

<style>
/* ГЛОБАЛЬНЫЕ СТИЛИ */
body { margin: 0; padding: 0; }

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #ffffff; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1f2937;
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
  background-color: #3b82f6; color: white;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
}
.btn-primary:hover { background-color: #2563eb; }
.btn-primary:disabled { background-color: #9ca3af; box-shadow: none; opacity: 0.7; }

.btn-secondary { background-color: #f3f4f6; color: #4b5563; }
.btn-secondary:hover { background-color: #e5e7eb; color: #1f2937; }
.btn-secondary:disabled { opacity: 0.5; }
</style>