<template>
  <section class="screen-game">
    <Toast :show="!!toastMessage" :message="toastMessage || ''" />
    
    <Modal 
      :show="showRestartModal" title="Начать заново?" 
      message="Весь текущий прогресс будет потерян."
      @confirm="confirmRestart" @cancel="showRestartModal = false"
    />

    <header class="header">
      <button @click="$emit('back')" class="btn btn-secondary btn-sm back-btn">
        <span class="back-arrow">←</span> меню
      </button>
      <div class="timer" :class="{ finished: isGameOver }">⏱ {{ formattedTime }}</div>
      <div class="stats">всего: <strong>{{ activeCount }}</strong></div>
    </header>

    <main class="grid-container">
      <div class="grid">
        <div 
          v-for="(cell, index) in cells" :key="cell.id"
          class="cell"
          :class="getCellClasses(cell, index)"
          @click="handleCellClick(index)"
        >
          {{ cell.value }}
        </div>
      </div>
      
      <div v-if="isGameOver" class="win-message">
        🎉 Победа! 🎉
        <div class="final-time">Время: {{ formattedTime }}</div>
        <div class="win-actions">
          <button @click="shareResult" class="btn btn-success btn-lg">📤 Поделиться</button>
          <button @click="$emit('back')" class="btn btn-primary btn-lg">В меню</button>
        </div>
      </div>
      <div class="spacer"></div>
    </main>

    <footer class="controls">
      <button @click="performUndo" class="btn btn-secondary btn-icon icon-text" :disabled="!hasHistory() || isGameOver || isBotActive" title="Отмена">⤺</button>
      
      <button @click="showNextHint" class="btn btn-secondary btn-icon icon-text" :disabled="isGameOver || isBotActive" title="Подсказка">⚐</button>
      
      <button @click="performAddLines" :disabled="isGameOver || isBotActive" class="btn btn-primary btn-lg">Добавить</button>

      <button 
        @click="handleToggleBot" 
        class="btn btn-icon" 
        :class="isBotActive ? 'btn-danger' : 'btn-secondary'"
        :disabled="isGameOver"
        title="Автоигра"
      >
        <svg v-if="isBotActive" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="16" x2="8" y2="16" />
          <line x1="16" y1="16" x2="16" y2="16" />
        </svg>
      </button>

      <button @click="showRestartModal = true" class="btn btn-danger btn-icon" title="Рестарт">↺</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { GameMode, GameRecord, Cell } from '../types';
import { GAME_CONFIG } from '../config';

// Composables
import { useGameLogic } from '../composables/useGameLogic';
import { useTimer } from '../composables/useTimer';
import { useHistory } from '../composables/useHistory';
import { useBot } from '../composables/useBot';
import { usePlayer } from '../composables/usePlayer';
import { usePersistence } from '../composables/usePersistence';
import { useGameHints } from '../composables/useGameHints';
import { useFeedback } from '../composables/useFeedback';

// Components & Assets
import Toast from '../components/Toast.vue';
import Modal from '../components/Modal.vue';
import confetti from 'canvas-confetti';
import '../assets/game.css';

const props = defineProps<{ mode: GameMode; resume?: boolean; }>();
defineEmits(['back']);

// 1. Core Systems
const { cells, nextId, generateCells, restoreCells, canMatch, addLines, findHint, cleanEmptyRows, findNeighbors } = useGameLogic();
const { secondsElapsed, formattedTime, startTimer, stopTimer, resetTimer } = useTimer();
const { recordMatch, recordAdd, recordClean, popHistory, undo, clearHistory, hasHistory, history } = useHistory(cells);
const { toastMessage, showToast, playSound, haptic } = useFeedback();

// 2. UI Helpers
const showRestartModal = ref(false);
const activeCount = computed(() => cells.value.filter(c => c.status !== 'crossed').length);
const isGameOver = computed(() => cells.value.length > 0 && activeCount.value === 0);

const scrollToCell = (index: number) => {
    const el = document.querySelectorAll('.cell')[index];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// 3. Hints System
const { hintIndices, showNextHint, clearHintUI, resetHintIndex } = useGameHints({
    findHint,
    scrollToCell,
    showToast
});

// 4. Bot System
const { isBotActive, toggleBot, stopBot } = useBot({
    cells,
    gameActions: { 
        canMatch, 
        findNeighbors, 
        // ИСПРАВЛЕНИЕ: Оборачиваем функцию, чтобы передать mode
        addLines: () => addLines(props.mode), 
        cleanEmptyRows 
    },
    historyActions: { recordMatch, recordAdd, recordClean, popHistory },
    uiActions: { playSound, showToast, scrollToCell },
    gameState: { isGameOver }
});

// 5. Player System
const { selectedIndex, neighborIndices, handleCellClick, resetSelection } = usePlayer({
    cells,
    gameActions: { canMatch, findNeighbors, cleanEmptyRows },
    historyActions: { recordMatch, recordClean, popHistory },
    uiActions: { playSound, showToast, haptic, clearHintUI },
    state: { isBotActive }
});

// 6. Persistence
const { save, load, clear: clearSave } = usePersistence('seeds-save', { cells, secondsElapsed, history, nextId });

// --- Controller Logic ---

watch(cells, () => { if (!isGameOver.value) save(props.mode); }, { deep: true });

watch(isGameOver, (val) => {
  if (val) {
    stopBot();
    stopTimer();
    playSound('win');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    
    const record: GameRecord = { date: Date.now(), time: secondsElapsed.value, mode: props.mode };
    const records = JSON.parse(localStorage.getItem('seeds-records') || '[]');
    records.push(record);
    localStorage.setItem('seeds-records', JSON.stringify(records));
    clearSave();
  }
});

const handleToggleBot = () => {
    if (!isBotActive.value) {
        // Безопасный сброс выделения перед запуском бота
        if (selectedIndex.value !== null) {
            const cell = cells.value[selectedIndex.value];
            if (cell) cell.status = 'active';
            selectedIndex.value = null;
            neighborIndices.value = [];
        }
        clearHintUI();
    }
    toggleBot();
};

const performUndo = () => {
  if (undo()) {
    playSound('undo');
    haptic.medium();
    resetSelection();
    clearHintUI();
    resetHintIndex();
  }
};

const performAddLines = () => {
  if (cells.value.length >= GAME_CONFIG.MAX_CELLS) {
    showToast('Слишком много цифр! Очистите поле.');
    haptic.medium();
    return;
  }
  
  // ИСПРАВЛЕНИЕ: Передаем режим игры
  const count = addLines(props.mode);
  
  if (count > 0) recordAdd(count);
  playSound('add');
  haptic.impact();
  
  clearHintUI();
  resetSelection();
  resetHintIndex();
  
  setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  showToast(`Добавлено ${count} цифр`);
};

const initGame = () => {
  resetSelection();
  clearHintUI();
  clearHistory();
  
  if (props.resume) {
    const parsed = load();
    if (parsed) {
        restoreCells(parsed.cells, parsed.nextId || 1000);
        resetTimer(parsed.time);
        if (parsed.history) {
            clearHistory();
            parsed.history.forEach((h: any) => history.value.push(h));
        }
        startTimer();
        return;
    }
  }
  generateCells(props.mode);
  resetTimer(0);
  clearSave();
  startTimer();
};

const confirmRestart = () => {
  playSound('restart');
  stopBot();
  clearSave();
  initGame();
  showRestartModal.value = false;
};

onMounted(initGame);
onUnmounted(() => {
  stopTimer();
  stopBot();
  if (!isGameOver.value) save(props.mode);
});

const getCellClasses = (cell: Cell, index: number) => {
  if (isBotActive.value) {
    return { 'crossed': cell.status === 'crossed', 'active': cell.status === 'active' };
  }
  const isNeighbor = neighborIndices.value.includes(index);
  const isMatchable = isNeighbor && selectedIndex.value !== null && canMatch(selectedIndex.value, index);

  return {
    'crossed': cell.status === 'crossed',
    'selected': cell.status === 'selected',
    'active': cell.status === 'active',
    'hint': hintIndices.value.includes(index),
    'neighbor': isNeighbor && !isMatchable,
    'neighbor-match': isMatchable
  };
};

const shareResult = async () => {
  const text = `🧩 Семечки\n🏆 Победа за ${formattedTime.value}!`;
  if (navigator.share) try { await navigator.share({ title: 'Победа!', text }); } catch {}
  else { await navigator.clipboard.writeText(text); showToast('Скопировано!'); }
};
</script>

<style scoped>
/* Стили находятся в src/assets/game.css */
</style>