<template>
  <section class="screen-game">
    <Toast :show="!!toastMessage" :message="toastMessage || ''" />
    
    <Modal 
      :show="showRestartModal" title="Начать заново?" 
      message="Весь текущий прогресс будет потерян."
      @confirm="confirmRestart" @cancel="showRestartModal = false"
    />

    <header class="header">
      <button @click="$emit('back')" class="btn btn-secondary btn-sm">← Меню</button>
      <div class="timer" :class="{ finished: isGameOver }">⏱ {{ formattedTime }}</div>
      <div class="stats">Осталось: <strong>{{ activeCount }}</strong></div>
    </header>

    <main class="grid-container">
      <div class="grid">
        <div 
          v-for="(cell, index) in cells" :key="cell.id"
          class="cell"
          :class="{
            'crossed': cell.status === 'crossed',
            'selected': cell.status === 'selected',
            'active': cell.status === 'active',
            'hint': hintIndices.includes(index)
          }"
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
      <button @click="showRestartModal = true" class="btn btn-secondary btn-icon" title="Рестарт">↺</button>
      <button @click="performUndo" class="btn btn-secondary btn-icon" :disabled="!hasHistory() || isGameOver" title="Отмена">↩️</button>
      <button @click="showNextHint" class="btn btn-secondary btn-icon" :disabled="isGameOver" title="Подсказка">💡</button>
      <button @click="performAddLines" :disabled="isGameOver" class="btn btn-primary btn-lg">Добавить (+{{ activeCount }})</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { GameMode, SavedGameState, GameRecord } from '../types';

import { useGameLogic } from '../composables/useGameLogic';
import { useTimer } from '../composables/useTimer';
import { useHistory } from '../composables/useHistory';

import Toast from '../components/Toast.vue';
import Modal from '../components/Modal.vue';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/audio';
import { haptic } from '../utils/haptics';

const props = defineProps<{ mode: GameMode; resume?: boolean; }>();
defineEmits(['back']);

const { cells, nextId, generateCells, restoreCells, canMatch, addLines, findHint } = useGameLogic();
const { secondsElapsed, formattedTime, startTimer, stopTimer, resetTimer } = useTimer();
const { saveSnapshot, undo, clearHistory, hasHistory, history } = useHistory(cells);

const selectedIndex = ref<number | null>(null);
const hintIndices = ref<number[]>([]);
const nextHintStartIndex = ref(0);
const showRestartModal = ref(false);
const toastMessage = ref<string | null>(null);
let toastTimer: number | null = null;
let hintTimeout: number | null = null;

const activeCount = computed(() => cells.value.filter(c => c.status !== 'crossed').length);
const isGameOver = computed(() => cells.value.length > 0 && activeCount.value === 0);

// --- Действия ---

const handleCellClick = (index: number) => {
  clearHintUI();
  const cell = cells.value[index];
  if (!cell || cell.status === 'crossed') return;

  if (selectedIndex.value === null) {
    playSound('select');
    haptic.soft();
    cell.status = 'selected';
    selectedIndex.value = index;
    return;
  }

  if (selectedIndex.value === index) {
    playSound('select');
    haptic.soft();
    cell.status = 'active';
    selectedIndex.value = null;
    return;
  }

  const prevIndex = selectedIndex.value;
  const prevCell = cells.value[prevIndex];

  if (prevCell && canMatch(prevIndex, index)) {
    saveSnapshot();
    playSound('match');
    haptic.success();
    prevCell.status = 'crossed';
    cell.status = 'crossed';
    selectedIndex.value = null;
    nextHintStartIndex.value = 0;
  } else {
    playSound('error');
    haptic.medium();
    if (prevCell) prevCell.status = 'active';
    cell.status = 'selected';
    selectedIndex.value = index;
  }
};

const performUndo = () => {
  if (undo()) {
    playSound('undo');
    haptic.medium();
    selectedIndex.value = null;
    clearHintUI();
    nextHintStartIndex.value = 0;
  }
};

const performAddLines = () => {
  if (cells.value.length >= 2000) {
    showToast('Слишком много цифр! Очистите поле.');
    haptic.medium();
    return;
  }
  
  saveSnapshot();
  const count = addLines();
  
  playSound('add');
  haptic.impact();
  clearHintUI();
  nextHintStartIndex.value = 0;
  
  // Исправление ошибки 1: Проверяем существование ячейки перед обращением
  if (selectedIndex.value !== null) {
    const cell = cells.value[selectedIndex.value];
    if (cell) cell.status = 'active';
    selectedIndex.value = null;
  }
  
  setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  showToast(`Добавлено ${count} цифр`);
};

// --- Подсказки ---
const showNextHint = () => {
  clearHintUI();
  
  // Ищем подсказку
  let hint = findHint(nextHintStartIndex.value);
  
  // Если не нашли с текущей позиции, пробуем сначала
  if (!hint && nextHintStartIndex.value > 0) {
    hint = findHint(0);
  }

  // ИСПРАВЛЕНИЕ:
  // Проверяем, что hint существует (не null)
  // И что первый элемент массива является числом (typeof ... === 'number')
  if (hint && typeof hint[0] === 'number') {
    const firstIndex = hint[0]; // Теперь TS уверен, что это number

    hintIndices.value = hint;
    nextHintStartIndex.value = firstIndex + 1;
    
    // Безопасное обращение к DOM
    const el = document.querySelectorAll('.cell')[firstIndex];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    hintTimeout = setTimeout(() => { hintIndices.value = []; }, 2000);
  } else {
    // Если hint === null или массив пустой
    showToast('Ходов нет! Жми "Добавить"');
    nextHintStartIndex.value = 0;
  }
};

const clearHintUI = () => {
  hintIndices.value = [];
  if (hintTimeout) clearTimeout(hintTimeout);
};

// --- Save/Load ---

const saveGameState = () => {
  if (isGameOver.value) { localStorage.removeItem('seeds-save'); return; }
  
  const state: SavedGameState = {
    cells: cells.value,
    time: secondsElapsed.value,
    mode: props.mode,
    history: history.value,
    nextId: nextId.value // Исправление: теперь используем .value, т.к. это ref
  };
  localStorage.setItem('seeds-save', JSON.stringify(state));
};

const initGame = () => {
  selectedIndex.value = null;
  clearHintUI();
  clearHistory();
  
  if (props.resume) {
    const saved = localStorage.getItem('seeds-save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        restoreCells(parsed.cells, parsed.nextId || 1000);
        resetTimer(parsed.time);
        if (parsed.history) {
            // Восстанавливаем историю. Так как history это ref внутри useHistory,
            // мы можем очистить и заполнить его
            clearHistory();
            parsed.history.forEach((h: string) => history.value.push(h));
        }
        startTimer();
        return;
      } catch (e) { console.error(e); }
    }
  }
  
  generateCells(props.mode);
  resetTimer(0);
  localStorage.removeItem('seeds-save');
  startTimer();
};

const confirmRestart = () => {
  playSound('restart');
  localStorage.removeItem('seeds-save');
  initGame(); // Перезапуск
  showRestartModal.value = false;
};

// --- Watchers ---

watch([cells, secondsElapsed], () => saveGameState(), { deep: true });

watch(isGameOver, (val) => {
  if (val) {
    stopTimer();
    playSound('win');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    
    const record: GameRecord = { date: Date.now(), time: secondsElapsed.value, mode: props.mode };
    const records = JSON.parse(localStorage.getItem('seeds-records') || '[]');
    records.push(record);
    localStorage.setItem('seeds-records', JSON.stringify(records));
    localStorage.removeItem('seeds-save');
  }
});

onMounted(initGame);
onUnmounted(stopTimer);

// UI Helpers
const showToast = (msg: string) => {
  if (toastTimer) clearTimeout(toastTimer);
  toastMessage.value = msg;
  toastTimer = setTimeout(() => { toastMessage.value = null; }, 2000);
};

const shareResult = async () => {
  const text = `🧩 Семечки\n🏆 Победа за ${formattedTime.value}!`;
  if (navigator.share) try { await navigator.share({ title: 'Победа!', text }); } catch {}
  else { await navigator.clipboard.writeText(text); showToast('Скопировано!'); }
};
</script>

<style scoped>
.screen-game { display: flex; flex-direction: column; min-height: 100vh; background-color: var(--bg-main); }
.header { position: sticky; top: 0; z-index: 10; background: var(--header-bg); padding: 12px 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(8px); }
.stats { font-size: 0.9rem; color: var(--text-muted); }
.stats strong { color: var(--text-main); font-size: 1.1rem; }
.timer { font-family: monospace; font-size: 1.2rem; font-weight: 700; color: #3b82f6; background: #eff6ff; padding: 4px 12px; border-radius: 20px; }
.timer.finished { color: #10b981; background: #ecfdf5; }
:global(body.dark-mode) .timer { background: #1e3a8a; color: #93c5fd; }
:global(body.dark-mode) .timer.finished { background: #064e3b; color: #34d399; }
.grid-container { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 15px; width: 100%; box-sizing: border-box; content-visibility: auto; contain-intrinsic-size: 1000px; }
.grid { display: grid; grid-template-columns: repeat(9, 1fr); gap: 4px; width: 100%; max-width: 500px; }
.cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 1.35rem; font-weight: 600; border-radius: 8px; background: var(--cell-bg); border: 1px solid var(--cell-border); color: var(--cell-text); cursor: pointer; user-select: none; touch-action: manipulation; transition: all 0.15s ease-out; }
.cell.selected { background-color: #3b82f6; color: white; border-color: #3b82f6; transform: scale(0.95); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); z-index: 2; }
.cell.crossed { background-color: transparent; color: var(--text-muted); opacity: 0.2; border-color: transparent; text-decoration: line-through; cursor: default; }
.cell.hint { background-color: #fde047; color: #854d0e; border-color: #eab308; animation: pulse 1s infinite; z-index: 3; }
@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
.controls { position: fixed; bottom: 0; left: 0; width: 100%; padding: 12px 16px 20px 16px; background: var(--header-bg); border-top: 1px solid var(--border-color); z-index: 20; display: flex; justify-content: center; gap: 12px; box-sizing: border-box; }
.spacer { height: 100px; width: 100%; }
.win-message { margin: 30px 0; font-size: 2rem; color: #10b981; font-weight: 800; text-align: center; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; align-items: center; gap: 10px; }
.win-actions { display: flex; gap: 10px; margin-top: 10px; }
.btn-success { background-color: #10b981; color: white; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3); }
.btn-success:hover { background-color: #059669; }
@keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
.final-time { font-size: 1.2rem; color: var(--text-main); font-weight: 600; }
@media (min-width: 768px) { .grid { gap: 8px; max-width: 600px; } .cell { font-size: 1.5rem; border-radius: 12px; } .cell:hover:not(.crossed):not(.selected):not(.hint) { background-color: var(--btn-sec-bg); border-color: #3b82f6; transform: translateY(-1px); } .controls { padding-bottom: 12px; } }
</style>