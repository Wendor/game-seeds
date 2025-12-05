<template>
  <section class="screen-menu">
    <div class="menu-content">
      <img src="/pwa-192x192.png" alt="Game Seeds Logo" width="192">
      <p class="game-subtitle">Логическая игра из детства</p>
      
      <div class="menu-buttons">
        <button @click="$emit('start', 'classic')" class="btn btn-primary btn-xl">
          Классика (1-19)
        </button>
        <button @click="$emit('start', 'random')" class="btn btn-primary btn-xl">
          Случайные числа
        </button>
        
        <button 
          v-if="canInstall" 
          @click="installApp" 
          class="btn btn-primary btn-xl install-btn"
        >
          📲 Установить приложение
        </button>

        <button @click="$emit('open-rules')" class="btn btn-secondary btn-lg">
          📜 Правила игры
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { GameMode } from '../types';

defineEmits<{
  (e: 'start', mode: GameMode): void;
  (e: 'open-rules'): void;
}>();

// --- Логика PWA установки ---
const canInstall = ref(false);
let deferredPrompt: any = null;

const handleInstallPrompt = (e: Event) => {
  // 1. Предотвращаем автоматическое появление диалога (на старых Chrome)
  e.preventDefault();
  // 2. Сохраняем событие, чтобы вызвать его позже
  deferredPrompt = e;
  // 3. Показываем кнопку
  canInstall.value = true;
};

const installApp = async () => {
  if (!deferredPrompt) return;
  
  // Показываем нативный диалог установки
  deferredPrompt.prompt();
  
  // Ждем выбора пользователя
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to install prompt: ${outcome}`);
  
  // Сбрасываем (событие одноразовое)
  deferredPrompt = null;
  canInstall.value = false;
};

// Слушаем события браузера
onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleInstallPrompt);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
});
</script>

<style scoped>
.screen-menu {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}
.menu-content { text-align: center; max-width: 400px; width: 100%; }
.game-title { font-size: 3rem; font-weight: 800; color: #0369a1; margin: 0; letter-spacing: -1px; }
.game-subtitle { font-size: 1.1rem; color: #64748b; margin-bottom: 40px; }
.menu-buttons { display: flex; flex-direction: column; gap: 16px; }

/* Стиль для кнопки установки - выделим её */
.install-btn {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
}

@media (min-width: 768px) {
  .screen-menu { background: #f8fafc; }
  .menu-content { 
    background: white; padding: 40px; border-radius: 24px;
    box-shadow: 0 20px 40px -5px rgba(0,0,0,0.1);
  }
}
</style>