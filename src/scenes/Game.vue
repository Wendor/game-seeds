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

    <GameHeader 
      :time="formattedTime"
      :active-count="activeCount"
      :is-game-over="isGameOver"
      @back="$emit('back')"
    />

    <div v-if="isBotActive" class="grid-blocker"></div>

    <main class="grid-container" ref="gridContainerRef" @scroll="handleScroll" :style="{ '--cols': GAME_CONFIG.ROW_SIZE }">
      
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

    <GameControls 
      :can-undo="hasHistory()"
      :is-game-over="isGameOver"
      :is-bot-active="isBotActive"
      @undo="performUndo"
      @hint="showNextHint"
      @add="performAddLines"
      @toggle-bot="handleToggleBot"
      @restart="showRestartModal = true"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { GameMode, GameRecord } from '../types';
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
import { useI18n } from '../composables/useI18n';
import { useStatistics } from '../composables/useStatistics';
import { useGridVirtualization } from '../composables/useGridVirtualization';
import { useCellStyling } from '../composables/useCellStyling'; // Новый импорт

// Components
import Toast from '../components/Toast.vue';
import Modal from '../components/Modal.vue';
import GameHeader from '../components/GameHeader.vue';
import GameControls from '../components/GameControls.vue';
import confetti from 'canvas-confetti';
import '../assets/game.css';

const { t } = useI18n();
const { incrementGamesStarted } = useStatistics();

const props = defineProps<{ mode: GameMode; resume?: boolean; }>();
const emit = defineEmits(['back', 'restart']);

// --- CORE LOGIC ---
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

// --- VIRTUAL SCROLL ---
const { 
  gridContainerRef, gridRef, handleScroll, visibleRows, 
  spacerTop, spacerBottom, topGhosts, bottomGhosts, 
  hasTopGhosts, hasBottomGhosts, measureDimensions, 
  updateGhosts, scrollToCell, scrollToBottom
} = useGridVirtualization(cells);

type GhostItem = { value: number; index: number } | null;

// --- ACTIONS & ORCHESTRATION ---
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
        indicesToDelete.forEach(idx => { if (cells.value[idx]) cells.value[idx].isDeleting = true; });
        updateGhosts();

        setTimeout(() => {
            recordClean();
            const removed = cleanEmptyRows();
            if (typeof removed === 'number' && removed > 0) {
                showToast(removed === 1 ? t('game.cleared') : t('game.clearedMulti', { n: removed }));
                playSound('add');
            }
            nextTick(updateGhosts);
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
            scrollToBottom();
            updateGhosts();
        });

        setTimeout(() => {
            for (let i = oldLength; i < cells.value.length; i++) {
              if (cells.value[i]) delete cells.value[i]?.isNew;
            }
        }, 500);
    }
    return count;
};

// --- HINTS & BOT ---
const { hintIndices, showNextHint, clearHintUI, resetHintIndex } = useGameHints({ findHint, scrollToCell, showToast });

const { isBotActive, toggleBot, stopBot } = useBot({
    cells,
    gameActions: { addLines: addLinesWithAnimation, cleanEmptyRows: animateAndClean, updateLinksAfterCross },
    historyActions: { recordMatch, recordAdd, recordClean, popHistory },
    uiActions: { playSound, showToast, scrollToCell },
    gameState: { isGameOver }
});

const performAddLines = () => {
    const count = addLinesWithAnimation();
    if (count > 0) showToast(t('game.added', { n: count }));
};

// --- PLAYER INTERACTION ---
const { selectedIndex, neighborIndices, handleCellClick, resetSelection } = usePlayer({
    cells,
    gameActions: { canMatch, findNeighbors, cleanEmptyRows: animateAndClean, updateLinksAfterCross },
    historyActions: { recordMatch, recordClean, popHistory },
    uiActions: { playSound, showToast, haptic, clearHintUI },
    state: { isBotActive }
});

// --- STYLING (Новый хук) ---
const { getCellClasses, getGroupClass, isNeighbor, isMatchable } = useCellStyling({
    isBotActive,
    neighborIndices,
    selectedIndex,
    hintIndices,
    canMatch
});

const handleGhostClick = (item: GhostItem) => {
  if (item && item.index !== undefined) {
    scrollToCell(item.index);
    setTimeout(() => handleCellClick(item.index), 150);
  }
};

const handleToggleBot = () => {
    if (!isBotActive.value) {
        resetSelection();
        clearHintUI();
    }
    toggleBot();
};

// --- PERSISTENCE & HISTORY ---
const { save, load, clear: clearSave } = usePersistence('seeds-save', { cells, secondsElapsed, history, nextId });

let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

watch(history, () => { if (!isGameOver.value) save(props.mode); }, { deep: false });

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

// --- LIFECYCLE & RESULTS ---
watch(isGameOver, (val) => {
  if (val) {
    stopBot();
    stopTimer();
    
    cells.value = []; 

    playSound('win');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    
    const record: GameRecord = { date: Date.now(), time: secondsElapsed.value, mode: props.mode };
    const records = JSON.parse(localStorage.getItem('seeds-records') || '[]');
    records.push(record);
    localStorage.setItem('seeds-records', JSON.stringify(records));
    clearSave();
  }
});

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
  autoSaveInterval = setInterval(() => {
    if (!isGameOver.value && activeCount.value > 0) save(props.mode);
  }, 30000);
});

onUnmounted(() => {
  stopTimer();
  stopBot();
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  if (!isGameOver.value) save(props.mode);
});
</script>

<style scoped>
/* styles in game.css */
</style>