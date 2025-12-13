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

    <Modal 
      :show="showDefeatModal" 
      :title="t('game.defeatTitle')" 
      :message="t('game.defeatMsg')"
      :confirm-text="t('game.tryAgain')"
      cancel-text=""
      @confirm="confirmRestart" 
      @cancel="confirmRestart"
    />

    <div v-if="isBotActive" class="grid-blocker"></div>

    <GameHeader 
      :time="formattedTime"
      :active-count="activeCount"
      :is-game-over="isGameOver"
      :back-text="backButtonLabel"
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
            @click="handleUserCellClick(cellData.originalIndex)" 
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
        
        <div v-if="levelStars > 0" class="win-stars">
          <span v-for="i in 3" :key="i" class="big-star" :class="{ filled: i <= levelStars }">★</span>
        </div>

        <div class="final-time">{{ t('game.time', { time: formattedTime }) }}</div>
        <div class="win-actions">
          <button @click="shareResult" class="btn btn-success btn-lg" style="gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
            {{ t('game.share') }}
          </button>
          <button @click="$emit('back')" class="btn btn-primary btn-lg">
            {{ exitButtonLabel }}
          </button>
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
import type { GameMode, LevelConfig } from '../types';
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
import { useCellStyling } from '../composables/useCellStyling';

// Components
import Toast from '../components/Toast.vue';
import Modal from '../components/Modal.vue';
import GameHeader from '../components/GameHeader.vue';
import GameControls from '../components/GameControls.vue';
import confetti from 'canvas-confetti';
import '../assets/game.css';

const { t } = useI18n();
const { incrementGamesStarted, saveGameRecord, saveLevelStars } = useStatistics();

const props = defineProps<{ 
  mode: GameMode; 
  resume?: boolean; 
  levelConfig?: LevelConfig;
}>();

const emit = defineEmits(['back', 'restart']);

// --- ТЕКСТ КНОПОК ---
const backButtonLabel = computed(() => {
  return props.mode === 'levels' ? t('game.toLevels') : t('game.menu');
});

const exitButtonLabel = computed(() => {
  return props.mode === 'levels' ? t('game.toLevelsBtn') : t('game.toMenu');
});

const levelStars = ref(0);
// --- НОВОЕ СОСТОЯНИЕ: Флаг старта игры ---
const hasGameStarted = ref(false);

const { 
  cells, nextId, generateCells, restoreCells, canMatch, addLines, 
  findHint, cleanEmptyRows, findNeighbors, updateLinksAfterCross, rebuildLinks,
} = useGameLogic();

const { secondsElapsed, formattedTime, startTimer, stopTimer, resetTimer } = useTimer();
const { recordMatch, recordAdd, recordClean, popHistory, undo, clearHistory, hasHistory, history } = useHistory(cells);
const { toastMessage, showToast, playSound, haptic } = useFeedback();

const showRestartModal = ref(false);
const showDefeatModal = ref(false);

const activeCount = computed(() => cells.value.filter(c => c.status !== 'crossed').length);
const isGameOver = computed(() => nextId.value > 0 && activeCount.value === 0);

// --- НОВАЯ ФУНКЦИЯ: Запуск таймера при первом действии ---
const ensureGameStarted = () => {
  if (!hasGameStarted.value) {
    hasGameStarted.value = true;
    startTimer();
  }
};

const { 
  gridContainerRef, gridRef, handleScroll, visibleRows, 
  spacerTop, spacerBottom, topGhosts, bottomGhosts, 
  hasTopGhosts, hasBottomGhosts, measureDimensions, 
  updateGhosts, scrollToCell, scrollToBottom
} = useGridVirtualization(cells);

type GhostItem = { value: number; index: number } | null;

const animateAndClean = (): number | void => {
    // ... (код animateAndClean без изменений) ...
    const ROW_SIZE = GAME_CONFIG.ROW_SIZE;
    const indicesToDelete: number[] = [];
    for (let i = 0; i < cells.value.length; i += ROW_SIZE) {
        const chunk = cells.value.slice(i, i + ROW_SIZE);
        if (chunk.length === ROW_SIZE && chunk.every(c => c.status === 'crossed')) {
            for (let j = 0; j < ROW_SIZE; j++) indicesToDelete.push(i + j);
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
        }, GAME_CONFIG.ANIMATION.CLEAN_DELAY);
        return; 
    }
    return 0;
};

const addLinesWithAnimation = (): number => {
    if (cells.value.length >= GAME_CONFIG.MAX_CELLS) {
        const hint = findHint(0);
        if (!hint) {
            playSound('error');
            haptic.impact();
            showDefeatModal.value = true;
            return 0;
        }
        showToast(t('game.fullLines'));
        haptic.medium();
        return 0;
    }

    const oldLength = cells.value.length;
    const addedIds = addLines(props.mode);
    const count = Array.isArray(addedIds) ? addedIds.length : addedIds; 
    
    if (count > 0 && Array.isArray(addedIds)) {
      for (let i = oldLength; i < cells.value.length; i++) {
          cells.value[i]!.isNew = true;
      }
        recordAdd(addedIds);
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
        }, GAME_CONFIG.ANIMATION.ADD_DELAY);
    }
    return count;
};

const { hintIndices, showNextHint, clearHintUI, resetHintIndex } = useGameHints({ findHint, scrollToCell, showToast });

const { isBotActive, toggleBot, stopBot } = useBot({
    cells,
    gameActions: { addLines: addLinesWithAnimation, cleanEmptyRows: animateAndClean, updateLinksAfterCross },
    historyActions: { recordMatch, recordAdd, recordClean, popHistory },
    uiActions: { playSound, showToast, scrollToCell },
    gameState: { isGameOver }
});

// --- ИЗМЕНЕНИЕ: Добавление строк стартует игру ---
const performAddLines = () => {
    ensureGameStarted(); // <--- Запускаем таймер
    const count = addLinesWithAnimation();
    if (count > 0) showToast(t('game.added', { n: count }));
};

// Переименовываем исходный handleCellClick, чтобы обернуть его
const { 
    selectedIndex, neighborIndices, 
    handleCellClick: playerHandleClick, // <-- переименовали
    resetSelection 
} = usePlayer({
    cells,
    gameActions: { canMatch, findNeighbors, cleanEmptyRows: animateAndClean, updateLinksAfterCross },
    historyActions: { recordMatch, recordClean, popHistory },
    uiActions: { playSound, showToast, haptic, clearHintUI },
    state: { isBotActive }
});

// --- НОВАЯ ФУНКЦИЯ: Обертка для клика пользователя ---
const handleUserCellClick = (index: number) => {
    ensureGameStarted(); // <--- Запускаем таймер
    playerHandleClick(index); // Вызываем логику игрока
};

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
    // Для призраков тоже используем обертку
    setTimeout(() => handleUserCellClick(item.index), GAME_CONFIG.ANIMATION.GHOST_CLICK);
  }
};

// --- ИЗМЕНЕНИЕ: Бот стартует игру ---
const handleToggleBot = () => {
    ensureGameStarted(); // <--- Запускаем таймер
    if (!isBotActive.value) {
        resetSelection();
        clearHintUI();
    }
    toggleBot();
};

const { save, load, clear: clearSave } = usePersistence('seeds-save', { cells, secondsElapsed, history, nextId });

let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

watch(history, () => { if (!isGameOver.value) save(props.mode, props.levelConfig?.id); }, { deep: false });

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

watch(isGameOver, (val) => {
  if (val) {
    stopBot();
    stopTimer();
    cells.value = [];
    playSound('win');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    saveGameRecord(props.mode, secondsElapsed.value, props.levelConfig?.id);
    
    if (props.mode === 'levels' && props.levelConfig) {
        const time = secondsElapsed.value;
        const [threeStar, twoStar] = props.levelConfig.thresholds;
        if (time <= threeStar) levelStars.value = 3;
        else if (time <= twoStar) levelStars.value = 2;
        else levelStars.value = 1;
        saveLevelStars(props.levelConfig.id, levelStars.value);
    } else {
        levelStars.value = 0;
    }
    clearSave();
  }
});

const initGame = () => {
  resetSelection();
  clearHintUI();
  clearHistory();
  levelStars.value = 0;
  hasGameStarted.value = false; // Сброс флага старта

  if (props.resume) {
    const parsed = load();
    if (parsed) {
        restoreCells(parsed.cells, parsed.nextId || 1000);
        resetTimer(parsed.time);
        if (parsed.history) {
            clearHistory();
            parsed.history.forEach((h: any) => history.value.push(h));
        }
        
        // Если это продолжение игры и время уже шло - запускаем сразу
        if (parsed.time > 0) {
            hasGameStarted.value = true;
            startTimer();
        }
        
        nextTick(() => { measureDimensions(); updateGhosts(); });
        return;
    }
  }
  
  incrementGamesStarted(props.mode);
  generateCells(props.mode, props.levelConfig?.pattern);
  resetTimer(0);
  clearSave();
  
  // startTimer(); <--- УДАЛЕНО. Таймер запустится при первом клике.
  
  nextTick(() => { measureDimensions(); updateGhosts(); });
};

const confirmRestart = () => {
  playSound('restart');
  stopBot();
  clearSave();
  emit('restart');
  showRestartModal.value = false;
  showDefeatModal.value = false;
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
    // Сохраняем, только если игра идет (есть активные ячейки)
    if (!isGameOver.value && activeCount.value > 0) save(props.mode, props.levelConfig?.id);
  }, 30000);
});

onUnmounted(() => {
  stopTimer();
  stopBot();
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  if (!isGameOver.value) save(props.mode, props.levelConfig?.id);
});
</script>

<style scoped>
/* Стили без изменений */
.win-stars {
  display: flex;
  gap: 8px;
  margin: 10px 0;
  justify-content: center;
}

.big-star {
  font-size: 3rem;
  color: var(--border-color);
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.big-star.filled {
  color: rgb(var(--rgb-yellow));
  transform: scale(1.1);
  filter: drop-shadow(0 4px 0px rgba(0,0,0,0.1));
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards;
}

.big-star.filled:nth-child(1) { animation-delay: 0.1s; }
.big-star.filled:nth-child(2) { animation-delay: 0.3s; }
.big-star.filled:nth-child(3) { animation-delay: 0.5s; }

@keyframes popIn {
    0% { opacity: 0; transform: scale(0.5); }
    100% { opacity: 1; transform: scale(1.1); }
}
</style>