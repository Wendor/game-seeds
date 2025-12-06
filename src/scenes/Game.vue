<template>
  <section class="screen-game">
    <Toast :show="!!toastMessage" :message="toastMessage || ''" />
    
    <Modal 
      :show="showRestartModal" :title="t('game.restartTitle')" 
      :message="t('game.restartMsg')"
      @confirm="confirmRestart" @cancel="showRestartModal = false"
    />

    <header class="header">
      <button @click="$emit('back')" class="btn btn-secondary btn-sm back-btn">
        <span class="back-arrow">←</span> {{ t('game.menu') }}
      </button>
      <div class="timer" :class="{ finished: isGameOver }">⏱ {{ formattedTime }}</div>
      <div class="stats">{{ t('game.total') }}: <strong>{{ activeCount }}</strong></div>
    </header>

    <main class="grid-container" ref="gridContainerRef" @scroll="handleScroll">
      
      <div class="ghost-row sticky-top" ref="topGhostRef" :class="{ visible: hasTopGhosts }">
        <div 
          v-for="(item, col) in topGhosts" 
          :key="'top-' + col" 
          class="cell ghost-cell"
          :class="{ 
            empty: !item,
            'is-neighbor': item && isNeighbor(item.index),
            'is-matchable': item && isMatchable(item.index)
          }"
          @click="handleGhostClick(item)"
        >
          {{ item ? item.value : '' }}
        </div>
      </div>

      <div class="grid" ref="gridRef" v-auto-animate>
        <div 
          v-for="(cell, index) in cells" :key="cell.id"
          class="cell"
          :data-index="index"
          :class="getCellClasses(cell, index)"
          @click="handleCellClick(index)"
        >
          {{ cell.value }}
        </div>
      </div>
      
      <div class="ghost-row sticky-bottom" ref="bottomGhostRef" :class="{ visible: hasBottomGhosts }">
        <div 
          v-for="(item, col) in bottomGhosts" 
          :key="'bot-' + col" 
          class="cell ghost-cell"
          :class="{ 
            empty: !item,
            'is-neighbor': item && isNeighbor(item.index),
            'is-matchable': item && isMatchable(item.index)
          }"
          @click="handleGhostClick(item)"
        >
          {{ item ? item.value : '' }}
        </div>
      </div>

      <div v-if="isGameOver" class="win-message">
        {{ t('game.win') }}
        <div class="final-time">{{ t('game.time', { time: formattedTime }) }}</div>
        <div class="win-actions">
          <button @click="shareResult" class="btn btn-success btn-lg" style="gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            {{ t('game.share') }}
          </button>
          
          <button @click="$emit('back')" class="btn btn-primary btn-lg">{{ t('game.toMenu') }}</button>
        </div>
      </div>
    </main>

    <footer class="controls">
        <button @click="performUndo" class="btn btn-secondary btn-icon icon-text" :disabled="!hasHistory() || isGameOver || isBotActive" :title="t('game.undo')">⤺</button>
      <button @click="showNextHint" class="btn btn-secondary btn-icon icon-text" :disabled="isGameOver || isBotActive" :title="t('game.hint')">⚐</button>
      <button @click="performAddLines" :disabled="isGameOver || isBotActive" class="btn btn-primary btn-lg">{{ t('game.add') }}</button>
      <button 
        @click="handleToggleBot" 
        class="btn btn-icon" 
        :class="isBotActive ? 'btn-danger' : 'btn-secondary'"
        :disabled="isGameOver"
        :title="t('game.auto')"
      >
        <svg v-if="isBotActive" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>
      </button>
      <button @click="showRestartModal = true" class="btn btn-secondary btn-icon" :title="t('game.restart')">↺</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { GameMode, GameRecord, Cell } from '../types';
import { GAME_CONFIG } from '../config';
import { useGameLogic } from '../composables/useGameLogic';
import { useTimer } from '../composables/useTimer';
import { useHistory } from '../composables/useHistory';
import { useBot } from '../composables/useBot';
import { usePlayer } from '../composables/usePlayer';
import { usePersistence } from '../composables/usePersistence';
import { useGameHints } from '../composables/useGameHints';
import { useFeedback } from '../composables/useFeedback';
import { useI18n } from '../composables/useI18n';
import { useStatistics } from '../composables/useStatistics';
import Toast from '../components/Toast.vue';
import Modal from '../components/Modal.vue';
import confetti from 'canvas-confetti';
import '../assets/game.css';

const { t } = useI18n();
const { incrementGamesStarted } = useStatistics();

const props = defineProps<{ mode: GameMode; resume?: boolean; }>();
const emit = defineEmits(['back', 'restart']);

const { 
  cells, 
  nextId, 
  generateCells, 
  restoreCells, 
  canMatch, 
  addLines, 
  findHint, 
  cleanEmptyRows, 
  findNeighbors,
  updateLinksAfterCross // Добавлено для оптимизации
} = useGameLogic();

const { secondsElapsed, formattedTime, startTimer, stopTimer, resetTimer } = useTimer();
const { recordMatch, recordAdd, recordClean, popHistory, undo, clearHistory, hasHistory, history } = useHistory(cells);
const { toastMessage, showToast, playSound, haptic } = useFeedback();

const showRestartModal = ref(false);
const activeCount = computed(() => cells.value.filter(c => c.status !== 'crossed').length);
const isGameOver = computed(() => nextId.value > 0 && activeCount.value === 0);

// --- GHOST LOGIC ---
type GhostItem = { value: number; index: number } | null;
const gridContainerRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);
const topGhostRef = ref<HTMLElement | null>(null);
const bottomGhostRef = ref<HTMLElement | null>(null);
const topGhosts = ref<GhostItem[]>(Array(9).fill(null));
const bottomGhosts = ref<GhostItem[]>(Array(9).fill(null));
const hasTopGhosts = computed(() => topGhosts.value.some(v => v !== null));
const hasBottomGhosts = computed(() => bottomGhosts.value.some(v => v !== null));

const getCellIndexAtPoint = (x: number, y: number): number | null => {
  const elements = document.elementsFromPoint(x, y);
  for (const el of elements) {
    if (el.classList.contains('cell') && el.hasAttribute('data-index')) {
      return parseInt(el.getAttribute('data-index')!, 10);
    }
  }
  return null;
};

const updateGhosts = () => {
    if (!gridContainerRef.value || !gridRef.value || !topGhostRef.value || !bottomGhostRef.value || cells.value.length === 0) return;

    const topPanelRect = topGhostRef.value.getBoundingClientRect();
    const bottomPanelRect = bottomGhostRef.value.getBoundingClientRect();
    const gridRect = gridRef.value.getBoundingClientRect();

    if (gridRect.top >= topPanelRect.bottom - 10 && gridRect.bottom <= bottomPanelRect.top + 10) {
        topGhosts.value.fill(null);
        bottomGhosts.value.fill(null);
        return;
    }

    const firstCell = gridRef.value.children[0] as HTMLElement;
    const cellWidth = firstCell ? firstCell.offsetWidth : 50;
    const checkX = gridRect.left + (cellWidth / 2);

    const checkTopY = topPanelRect.bottom - 5;
    let topIndex = getCellIndexAtPoint(checkX, checkTopY);
    if (topIndex === null) topIndex = getCellIndexAtPoint(checkX, checkTopY - 15);

    for (let col = 0; col < 9; col++) {
        let foundItem: GhostItem = null;
        if (topIndex !== null) {
        const startIdx = (Math.floor(topIndex / 9) * 9) + col;
        for (let i = startIdx; i >= 0; i -= 9) {
            if (i >= cells.value.length) continue; 
            const cell = cells.value[i];
            if (cell && cell.status !== 'crossed') {
            foundItem = { value: cell.value, index: i };
            break; 
            }
        }
        }
        topGhosts.value[col] = foundItem;
    }

    const checkBottomY = bottomPanelRect.top + 5;
    let bottomIndex = getCellIndexAtPoint(checkX, checkBottomY);
    if (bottomIndex === null) bottomIndex = getCellIndexAtPoint(checkX, checkBottomY + 15);

    for (let col = 0; col < 9; col++) {
        let foundItem: GhostItem = null;
        if (bottomIndex !== null) {
        const startIdx = (Math.floor(bottomIndex / 9) * 9) + col;
        for (let i = startIdx; i < cells.value.length; i += 9) {
            if (i < 0) continue; 
            const cell = cells.value[i];
            if (cell && cell.status !== 'crossed') {
            foundItem = { value: cell.value, index: i };
            break;
            }
        }
        }
        bottomGhosts.value[col] = foundItem;
    }
};

const handleScroll = () => requestAnimationFrame(updateGhosts);
watch(cells, () => nextTick(updateGhosts), { deep: true });

const isNeighbor = (index: number) => neighborIndices.value.includes(index);
const isMatchable = (index: number) => {
  return selectedIndex.value !== null && 
         neighborIndices.value.includes(index) && 
         canMatch(selectedIndex.value, index);
};

const handleGhostClick = (item: GhostItem) => {
  if (item && item.index !== undefined) {
    handleCellClick(item.index);
  }
};

const scrollToCell = (index: number) => {
    const el = document.querySelectorAll('.grid .cell')[index];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// --- COMPOSABLES INIT ---

const { hintIndices, showNextHint, clearHintUI, resetHintIndex } = useGameHints({ findHint, scrollToCell, showToast });

const { isBotActive, toggleBot, stopBot } = useBot({
    cells,
    gameActions: { 
      canMatch, 
      findNeighbors, 
      addLines: () => addLines(props.mode), 
      cleanEmptyRows,
      updateLinksAfterCross // Передаем метод оптимизации
    },
    historyActions: { recordMatch, recordAdd, recordClean, popHistory },
    uiActions: { playSound, showToast, scrollToCell },
    gameState: { isGameOver }
});

const { selectedIndex, neighborIndices, handleCellClick, resetSelection } = usePlayer({
    cells,
    gameActions: { 
      canMatch, 
      findNeighbors, 
      cleanEmptyRows,
      updateLinksAfterCross // Передаем метод оптимизации
    },
    historyActions: { recordMatch, recordClean, popHistory },
    uiActions: { playSound, showToast, haptic, clearHintUI },
    state: { isBotActive }
});

const { save, load, clear: clearSave } = usePersistence('seeds-save', { cells, secondsElapsed, history, nextId });

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
    nextTick(updateGhosts); 
  }
};

const performAddLines = () => {
  if (cells.value.length >= GAME_CONFIG.MAX_CELLS) {
    showToast(t('game.fullLines'));
    haptic.medium();
    return;
  }
  const count = addLines(props.mode);
  if (count > 0) recordAdd(count);
  playSound('add');
  haptic.impact();
  clearHintUI();
  resetSelection();
  resetHintIndex();
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    updateGhosts();
  }, 100);
  showToast(t('game.added', { n: count }));
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
        nextTick(updateGhosts);
        return;
    }
  }
  
  incrementGamesStarted(props.mode);
  
  generateCells(props.mode);
  resetTimer(0);
  clearSave();
  startTimer();
  nextTick(updateGhosts);
};

const confirmRestart = () => {
  playSound('restart');
  stopBot();
  clearSave();
  // ВМЕСТО initGame() ТЕПЕРЬ ОТПРАВЛЯЕМ СОБЫТИЕ РОДИТЕЛЮ
  emit('restart');
  showRestartModal.value = false;
};

onMounted(() => {
  initGame();
  window.addEventListener('resize', updateGhosts);
});
onUnmounted(() => {
  stopTimer();
  stopBot();
  window.removeEventListener('resize', updateGhosts);
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
  const url = window.location.href;
  const modeName = t(`stats.${props.mode}`);
  const text = `${t('game.shareText', { mode: modeName, time: formattedTime.value })}\n${url}`;
  
  if (navigator.share) try { await navigator.share({ title: 'Seeds', text, url }); } catch {}
  else { await navigator.clipboard.writeText(text); showToast(t('game.copied')); }
};
</script>

<style scoped>
/* Стили находятся в src/assets/game.css */
</style>