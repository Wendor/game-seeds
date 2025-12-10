<template>
  <section class="screen-game">
    <Toast :show="!!toastMessage" :message="toastMessage || ''" />
    
    <Modal 
      :show="showRestartModal" 
      :title="t('game.restartTitle')" 
      :message="t('game.restartMsg')"
      :confirm-text="t('game.yes')"
      :cancel-text="t('game.cancel')"
      @confirm="confirmRestart" 
      @cancel="showRestartModal = false"
    />

    <header class="header">
      <button @click="$emit('back')" class="btn btn-secondary btn-sm back-btn">
        <span class="back-arrow">←</span> {{ t('game.menu') }}
      </button>
      <div class="timer" :class="{ finished: isGameOver }">⏱ {{ formattedTime }}</div>
      <div class="stats">{{ t('game.total') }}: <strong>{{ activeCount }}</strong></div>
    </header>

    <main class="grid-container" ref="gridContainerRef" @scroll="handleScroll">
      
      <div id="ghost-top-sentinel" class="ghost-row sticky-top" :class="{ visible: hasTopGhosts }">
        <div 
          v-for="(item, col) in topGhosts" 
          :key="'top-' + col" 
          class="cell ghost-cell"
          :class="{ 
            empty: !item,
            'is-neighbor': item && isNeighbor(item.index),
            'is-matchable': item && isMatchable(item.index),
            [item ? getGroupClass(item.value) : '']: true  }"
          @click="handleGhostClick(item)"
        >
          {{ item ? item.value : '' }}
        </div>
      </div>

      <div class="virtual-spacer" :style="{ height: spacerTop + 'px' }"></div>
      
      <div class="grid-virtual" ref="gridRef">
        <div 
          v-for="row in visibleRows" 
          :key="row.rowIndex"
          class="virtual-row"
          :data-row-index="row.rowIndex" 
        >
          <div 
            v-for="cellData in row.items" 
            :key="cellData.cell.id"
            class="cell"
            :data-index="cellData.originalIndex"
            :class="getCellClasses(cellData.cell, cellData.originalIndex)"
            @click="handleCellClick(cellData.originalIndex)"
          >
            {{ cellData.cell.value }}
          </div>
        </div>
      </div>

      <div class="virtual-spacer" :style="{ height: spacerBottom + 'px' }"></div>
      
      <div id="ghost-bottom-sentinel" class="ghost-row sticky-bottom" :class="{ visible: hasBottomGhosts }">
        <div 
          v-for="(item, col) in bottomGhosts" 
          :key="'bot-' + col" 
          class="cell ghost-cell"
          :class="{ 
            empty: !item,
            'is-neighbor': item && isNeighbor(item.index),
            'is-matchable': item && isMatchable(item.index),
            [item ? getGroupClass(item.value) : '']: true  }"
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
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
      <button @click="handleToggleBot" class="btn btn-icon" :class="isBotActive ? 'btn-danger' : 'btn-secondary'" :disabled="isGameOver" :title="t('game.auto')">
        <svg v-if="isBotActive" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>
      </button>
      <button @click="showRestartModal = true" class="btn btn-secondary btn-icon" :title="t('game.restart')">↺</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, toRaw } from 'vue';
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

// --- LOGIC ---
const { 
  cells, nextId, generateCells, restoreCells, canMatch, addLines, 
  findHint, cleanEmptyRows, findNeighbors, updateLinksAfterCross, rebuildLinks,
} = useGameLogic();

const { secondsElapsed, formattedTime, startTimer, stopTimer, resetTimer } = useTimer();
const { recordMatch, recordAdd, recordClean, popHistory, undo, clearHistory, hasHistory, history } = useHistory(cells);
const { toastMessage, showToast, playSound, haptic } = useFeedback();

const showRestartModal = ref(false);
const activeCount = computed(() => cells.value.filter(c => c.status !== 'crossed').length);
const isGameOver = computed(() => nextId.value > 0 && activeCount.value === 0);

// --- VIRTUAL SCROLL CONFIG ---
const gridContainerRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const containerHeight = ref(800);

const rowHeight = ref(50);
const headerHeight = ref(54); 
const bottomBarHeight = ref(54);
const BUFFER = 6; 

const measureDimensions = () => {
  // 1. Замеряем панели (Sentinel)
  const topSentinel = document.getElementById('ghost-top-sentinel');
  const bottomSentinel = document.getElementById('ghost-bottom-sentinel');
  
  if (topSentinel) headerHeight.value = topSentinel.offsetHeight;
  if (bottomSentinel) bottomBarHeight.value = bottomSentinel.offsetHeight;

  let realRowHeight = 0;
  
  if (gridRef.value && gridRef.value.firstElementChild) {
    // Если есть отрендеренный ряд
    const firstRow = gridRef.value.firstElementChild as HTMLElement;
    realRowHeight = firstRow.offsetHeight;
  } else if (topSentinel) {
    // Если нет рядов (пусто), берем высоту сентинела (он такой же по структуре)
    realRowHeight = topSentinel.offsetHeight;
  }

  if (realRowHeight > 0 && Math.abs(realRowHeight - rowHeight.value) > 0.5) {
    rowHeight.value = realRowHeight;
    // Если хедер сильно отличается, тоже подгоняем (обычно они равны)
    if (headerHeight.value === 0) headerHeight.value = realRowHeight;
  }
};

const chunkedRows = computed(() => {
  const result = [];
  const rawCells = cells.value;
  for (let i = 0; i < rawCells.length; i += 9) {
    result.push({ 
      items: rawCells.slice(i, i + 9).map((c, localIdx) => ({ cell: c, originalIndex: i + localIdx })), 
      rowIndex: i / 9 
    });
  }
  return result;
});

const visibleRange = computed(() => {
  if (rowHeight.value === 0) return { start: 0, end: 10 };
  
  // Контент начинается ПОСЛЕ верхней панели
  const scrolledContent = Math.max(0, scrollTop.value - headerHeight.value);
  const start = Math.floor(scrolledContent / rowHeight.value);
  const visibleCount = Math.ceil(containerHeight.value / rowHeight.value);
  
  return {
    start: Math.max(0, start - BUFFER),
    end: Math.min(chunkedRows.value.length, start + visibleCount + BUFFER)
  };
});

const visibleRows = computed(() => {
  const { start, end } = visibleRange.value;
  return chunkedRows.value.slice(start, end);
});

const spacerTop = computed(() => visibleRange.value.start * rowHeight.value);
const spacerBottom = computed(() => (chunkedRows.value.length - visibleRange.value.end) * rowHeight.value);

const handleScroll = (e: Event) => {
  scrollTop.value = (e.target as HTMLElement).scrollTop;
};

// --- GHOSTS LOGIC ---
type GhostItem = { value: number; index: number } | null;
const topGhosts = ref<GhostItem[]>(Array(9).fill(null));
const bottomGhosts = ref<GhostItem[]>(Array(9).fill(null));
const hasTopGhosts = computed(() => topGhosts.value.some(v => v !== null));
const hasBottomGhosts = computed(() => bottomGhosts.value.some(v => v !== null));

const updateGhosts = () => {
    if (cells.value.length === 0 || rowHeight.value === 0) return;

    const offsetTop = rowHeight.value;    
    // Координата внутри сетки (вычитаем headerHeight!)
    const gridScrollY = scrollTop.value - headerHeight.value;
    // Индекс ряда, который сейчас уходит вверх
    const topRowIndex = Math.floor((gridScrollY + offsetTop) / rowHeight.value) + 1;

    for (let col = 0; col < 9; col++) {
        let foundItem: GhostItem = null;
        const startIdx = ((topRowIndex - 1) * 9) + col;
        for (let i = startIdx; i >= 0; i -= 9) {
            if (i >= cells.value.length) continue;
            const cell = cells.value[i];
            if (cell && cell.status !== 'crossed' && !cell.isDeleting) {
                foundItem = { value: cell.value, index: i };
                break;
            }
        }
        topGhosts.value[col] = foundItem;
    }

    const viewportBottomInGrid = (scrollTop.value + containerHeight.value) - bottomBarHeight.value - headerHeight.value;
    
    const offsetBottom = rowHeight.value * 0.2;
    
    const bottomRowIndex = Math.floor((viewportBottomInGrid - offsetBottom) / rowHeight.value) - 1;
    
    for (let col = 0; col < 9; col++) {
        let foundItem: GhostItem = null;
        const startIdx = ((bottomRowIndex + 1) * 9) + col;
        for (let i = startIdx; i < cells.value.length; i += 9) {
            if (i < 0) continue;
            const cell = cells.value[i];
            if (cell && cell.status !== 'crossed' && !cell.isDeleting) {
                foundItem = { value: cell.value, index: i };
                break;
            }
        }
        bottomGhosts.value[col] = foundItem;
    }
};

watch([scrollTop, cells], updateGhosts, { flush: 'post' });

let resizeObserver: ResizeObserver | null = null;

const animateAndClean = (): number | void => {
    const ROW_SIZE = 9;
    const indicesToDelete: number[] = [];
    for (let i = 0; i < cells.value.length; i += ROW_SIZE) {
        const chunk = cells.value.slice(i, i + ROW_SIZE);
        if (chunk.length === ROW_SIZE && chunk.every(c => c.status === 'crossed')) {
            for (let j = 0; j < 9; j++) indicesToDelete.push(i + j);
        }
    }

    if (indicesToDelete.length > 0) {
        indicesToDelete.forEach(idx => {
            if (cells.value[idx]) cells.value[idx].isDeleting = true;
        });
        updateGhosts();

        setTimeout(() => {
            recordClean();
            const removed = cleanEmptyRows();
            if (typeof removed === 'number' && removed > 0) {
                showToast(removed === 1 ? t('game.cleared') : t('game.clearedMulti', { n: removed }));
                playSound('add');
            }
            // После удаления высота скролла меняется, призраки должны обновиться
            updateGhosts();
        }, 300);
        return; 
    }
    return 0;
};

const addLinesWithAnimation = (): number => {
    if (cells.value.length >= GAME_CONFIG.MAX_CELLS) {
        showToast(t('game.fullLines'));
        haptic.medium();
        return 0;
    }

    const oldLength = cells.value.length;
    const count = addLines(props.mode);
    
    if (count > 0) {
      for (let i = oldLength; i < cells.value.length; i++) {
          cells.value[i]!.isNew = true;
      }
        recordAdd(count);
        playSound('add');
        haptic.impact();
        
        clearHintUI();
        resetSelection();
        resetHintIndex();

        nextTick(() => {
            measureDimensions();
            
            const container = gridContainerRef.value;
            if (container) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }
            updateGhosts();
        });

        setTimeout(() => {
            for (let i = oldLength; i < cells.value.length; i++) {
              if (cells.value[i]) {
                delete cells.value[i]?.isNew;
              }
            }
        }, 500);
    }
    return count;
};

// --- CONNECTORS ---
const isNeighbor = (index: number) => neighborIndices.value.includes(index);
const isMatchable = (index: number) => {
  return selectedIndex.value !== null && neighborIndices.value.includes(index) && canMatch(selectedIndex.value, index);
};

const handleGhostClick = (item: GhostItem) => {
  if (item && item.index !== undefined) {
    scrollToCell(item.index);
    setTimeout(() => handleCellClick(item.index), 150);
  }
};

const scrollToCell = (index: number) => {
    const container = gridContainerRef.value;
    if (container && rowHeight.value > 0) {
        const rowIndex = Math.floor(index / 9);
        let targetPos = (rowIndex * rowHeight.value) + headerHeight.value - (containerHeight.value / 2) + (rowHeight.value / 2);
        targetPos = Math.max(0, targetPos);
        container.scrollTo({ top: targetPos, behavior: 'smooth' });
    }
};

const { hintIndices, showNextHint, clearHintUI, resetHintIndex } = useGameHints({ findHint, scrollToCell, showToast });

const { isBotActive, toggleBot, stopBot } = useBot({
    cells,
    gameActions: { 
      addLines: addLinesWithAnimation, 
      cleanEmptyRows: animateAndClean,
      updateLinksAfterCross
    },
    historyActions: { recordMatch, recordAdd, recordClean, popHistory },
    uiActions: { playSound, showToast, scrollToCell },
    gameState: { isGameOver }
});

const performAddLines = () => {
    const count = addLinesWithAnimation();
    if (count > 0) showToast(t('game.added', { n: count }));
};

const playerGameActions = { 
    canMatch, 
    findNeighbors, 
    cleanEmptyRows: animateAndClean,
    updateLinksAfterCross 
};

const { selectedIndex, neighborIndices, handleCellClick, resetSelection } = usePlayer({
    cells,
    gameActions: playerGameActions,
    historyActions: { recordMatch, recordClean, popHistory },
    uiActions: { playSound, showToast, haptic, clearHintUI },
    state: { isBotActive }
});

const { save, load, clear: clearSave } = usePersistence('seeds-save', { cells, secondsElapsed, history, nextId });

//watch(cells, () => { if (!isGameOver.value) save(props.mode); }, { deep: true });
let autoSaveInterval: ReturnType<typeof setInterval> | null = null;
watch(history, () => {
  if (!isGameOver.value) {
    save(props.mode);
  }
});

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
        resetSelection();
        clearHintUI();
    }
    toggleBot();
};

const performUndo = () => {
  if (undo()) {
    playSound('undo');
    haptic.medium();
    rebuildLinks();
    resetSelection();
    clearHintUI();
    resetHintIndex();
    nextTick(updateGhosts); 
  }
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
        // Ждем рендера, чтобы замерить высоту реальной ячейки
        nextTick(() => { measureDimensions(); updateGhosts(); });
        return;
    }
  }
  incrementGamesStarted(props.mode);
  generateCells(props.mode);
  resetTimer(0);
  clearSave();
  startTimer();
  nextTick(() => { measureDimensions(); updateGhosts(); });
};

const confirmRestart = () => {
  playSound('restart');
  stopBot();
  clearSave();
  emit('restart');
  showRestartModal.value = false;
};

const getGroupClass = (val: number) => {
  if (val === 1 || val === 9) return 'cell-group-1';
  if (val === 2 || val === 8) return 'cell-group-2';
  if (val === 3 || val === 7) return 'cell-group-3';
  if (val === 4 || val === 6) return 'cell-group-4';
  if (val === 5) return 'cell-group-5';
  return '';
};

const getCellClasses = (cell: Cell, index: number) => {
  const classes: Record<string, boolean> = {
    'crossed': cell.status === 'crossed',
    'selected': cell.status === 'selected',
    'active': cell.status === 'active',
    'deleting': !!cell.isDeleting,
    'new-cell': !!cell.isNew
  };
  if (cell.status !== 'crossed') {
    const groupClass = getGroupClass(cell.value);
    if (groupClass) classes[groupClass] = true;
  }
  if (isBotActive.value) return classes;
  const isNeighborIndex = neighborIndices.value.includes(index);
  const isMatchable = isNeighborIndex && selectedIndex.value !== null && canMatch(selectedIndex.value, index);
  return {
    ...classes,
    'hint': hintIndices.value.includes(index),
    'neighbor': isNeighborIndex && !isMatchable,
    'neighbor-match': isMatchable
  };
};

const shareResult = async () => {
  const url = window.location.href;
  const modeName = t(`stats.${props.mode}`);
  const baseText = t('game.shareText', { mode: modeName, time: formattedTime.value });
  if (navigator.share) {
    try { await navigator.share({ title: 'Seeds', text: baseText, url }); } catch {}
  } else {
    await navigator.clipboard.writeText(`${baseText}\n${url}`); 
    showToast(t('game.copied'));
  }
};

onMounted(() => {
  initGame();
  
  if (gridContainerRef.value) {
    containerHeight.value = gridContainerRef.value.clientHeight;
    
    resizeObserver = new ResizeObserver(() => {
      if (gridContainerRef.value) {
        containerHeight.value = gridContainerRef.value.clientHeight;
        // При ресайзе всегда перемеряем
        measureDimensions();
        updateGhosts();
      }
    });
    resizeObserver.observe(gridContainerRef.value);
    
    // Запускаем замер через небольшую паузу, чтобы стили применились
    setTimeout(measureDimensions, 200);
  }

  autoSaveInterval = setInterval(() => {
    if (!isGameOver.value && activeCount.value > 0) {
      save(props.mode);
    }
  }, 30000);
});

onUnmounted(() => {
  stopTimer();
  stopBot();
  if (resizeObserver) resizeObserver.disconnect();
  if (!isGameOver.value) save(props.mode);
});
</script>

<style scoped>
.grid-virtual {
  display: block;
  width: 100%;
  max-width: 500px;
}
.virtual-row {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 4px;
  width: 100%;
}
.virtual-spacer {
    width: 100%;
    flex-shrink: 0; 
}
@media (min-width: 768px) {
  .grid-virtual { max-width: 600px; }
  .virtual-row { gap: 8px; }
}
</style>