<template>
  <section class="screen-game">
    
    <Toast :show="!!toastMessage" :message="toastMessage || ''" />

    <Modal 
      :show="showRestartModal" 
      title="Начать заново?" 
      message="Весь текущий прогресс будет потерян."
      @confirm="confirmRestart"
      @cancel="showRestartModal = false"
    />

    <header class="header">
      <button @click="$emit('back')" class="btn btn-secondary btn-sm">← Меню</button>
      <div class="stats">Осталось: <strong>{{ activeCount }}</strong></div>
      <div style="width: 60px;"></div> 
    </header>

    <main class="grid-container">
      <div class="grid">
        <div 
          v-for="(cell, index) in cells" 
          :key="cell.id"
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
        <button @click="$emit('back')" class="btn btn-primary">В меню</button>
      </div>
      
      <div class="spacer"></div>
    </main>

    <footer class="controls">
      <button @click="showRestartModal = true" class="btn btn-secondary btn-icon" title="Рестарт">↺</button>
      
      <button @click="showNextHint" class="btn btn-secondary btn-icon" :disabled="isGameOver" title="Подсказка">💡</button>
      
      <button @click="addMoreNumbers" :disabled="isGameOver" class="btn btn-primary btn-lg">
        Добавить (+{{ activeCount }})
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Cell, GameMode, CellStatus } from '../types';

// Импортируем новые компоненты
import Toast from './Toast.vue';
import Modal from './Modal.vue';

const props = defineProps<{ mode: GameMode }>();
const emit = defineEmits(['back']);

const cells = ref<Cell[]>([]);
const selectedIndex = ref<number | null>(null);
const hintIndices = ref<number[]>([]);
const nextHintStartIndex = ref(0);
let nextId = 0;
let hintTimeout: number | null = null;

// --- Состояние для UI (Алерты) ---
const toastMessage = ref<string | null>(null); // Текст сообщения
const showRestartModal = ref(false); // Видимость модалки
let toastTimer: number | null = null;

const SEQUENCE_CLASSIC = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  1, 0, 1, 1, 1, 2, 1, 3, 1, 4,
  1, 5, 1, 6, 1, 7, 1, 8, 1, 9
];

const activeCount = computed(() => cells.value.filter(c => c.status !== 'crossed').length);
const isGameOver = computed(() => cells.value.length > 0 && activeCount.value === 0);

// --- Хелпер для показа тостов ---
const showToast = (msg: string) => {
  if (toastTimer) clearTimeout(toastTimer);
  toastMessage.value = msg;
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
  }, 2000); // Скрываем через 2 секунды
};

// --- Инициализация ---

const initGame = () => {
  nextId = 0;
  selectedIndex.value = null;
  hintIndices.value = [];
  nextHintStartIndex.value = 0;
  
  if (props.mode === 'classic') {
    cells.value = SEQUENCE_CLASSIC.map(num => ({ id: nextId++, value: num, status: 'active' }));
  } else {
    const randomSeq = Array.from({ length: 36 }, () => Math.floor(Math.random() * 9) + 1);
    cells.value = randomSeq.map(num => ({ id: nextId++, value: num, status: 'active' }));
  }
};

// Логика подтверждения рестарта
const confirmRestart = () => {
  initGame();
  showRestartModal.value = false;
};

onMounted(() => {
  initGame();
});

// --- Логика игры ---

const canMatch = (idx1: number, idx2: number): boolean => {
  const c1 = cells.value[idx1];
  const c2 = cells.value[idx2];
  if (!c1 || !c2) return false;
  if (c1.status === 'crossed' || c2.status === 'crossed') return false;
  const v1 = c1.value;
  const v2 = c2.value;
  if (v1 !== v2 && v1 + v2 !== 10) return false;
  return isHorizontalNeighbor(idx1, idx2) || isVerticalNeighbor(idx1, idx2);
};

const isHorizontalNeighbor = (idx1: number, idx2: number): boolean => {
  const start = Math.min(idx1, idx2);
  const end = Math.max(idx1, idx2);
  for (let i = start + 1; i < end; i++) {
    const c = cells.value[i];
    if (c && c.status !== 'crossed') return false; 
  }
  return true;
};

const isVerticalNeighbor = (idx1: number, idx2: number): boolean => {
  const col1 = idx1 % 9;
  const col2 = idx2 % 9;
  if (col1 !== col2) return false;
  const start = Math.min(idx1, idx2);
  const end = Math.max(idx1, idx2);
  for (let i = start + 9; i < end; i += 9) {
    const c = cells.value[i];
    if (c && c.status !== 'crossed') return false; 
  }
  return true;
};

const handleCellClick = (index: number) => {
  clearHint();
  const cell = cells.value[index];
  if (!cell || cell.status === 'crossed') return;

  if (selectedIndex.value === null) {
    cell.status = 'selected';
    selectedIndex.value = index;
    return;
  }

  if (selectedIndex.value === index) {
    cell.status = 'active';
    selectedIndex.value = null;
    return;
  }

  const prevIndex = selectedIndex.value;
  const prevCell = cells.value[prevIndex];
  
  if (prevCell && canMatch(prevIndex, index)) {
    prevCell.status = 'crossed';
    cell.status = 'crossed';
    selectedIndex.value = null;
    nextHintStartIndex.value = 0; 
  } else {
    if (prevCell) prevCell.status = 'active';
    cell.status = 'selected';
    selectedIndex.value = index;
  }
};

// --- Подсказки и Добавление ---

const clearHint = () => {
  hintIndices.value = [];
  if (hintTimeout) clearTimeout(hintTimeout);
};

const findMatchFrom = (startIndex: number): boolean => {
  const len = cells.value.length;
  for (let i = startIndex; i < len; i++) {
    const c1 = cells.value[i];
    if (!c1 || c1.status === 'crossed') continue;
    for (let j = i + 1; j < len; j++) {
       const c2 = cells.value[j];
       if (!c2 || c2.status === 'crossed') continue;
       if (canMatch(i, j)) {
         hintIndices.value = [i, j];
         const el = document.querySelectorAll('.cell')[i];
         if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
         hintTimeout = setTimeout(() => { hintIndices.value = []; }, 2000);
         nextHintStartIndex.value = i + 1;
         return true;
       }
    }
  }
  return false;
};

const showNextHint = () => {
  clearHint();
  const found = findMatchFrom(nextHintStartIndex.value);
  if (!found) {
    if (nextHintStartIndex.value > 0) {
      const foundFromStart = findMatchFrom(0);
      if (!foundFromStart) {
        nextHintStartIndex.value = 0;
        // ЗАМЕНА ALERT НА TOAST
        showToast('Ходов нет! Жми "Добавить"');
      }
    } else {
      // ЗАМЕНА ALERT НА TOAST
      showToast('Ходов нет! Жми "Добавить"');
    }
  }
};

const addMoreNumbers = () => {
  clearHint();
  nextHintStartIndex.value = 0; 

  const activeNumbers = cells.value
    .filter(c => c.status !== 'crossed')
    .map(c => c.value);

  const newCells = activeNumbers.map(num => ({
    id: nextId++,
    value: num,
    status: 'active' as CellStatus
  }));

  if (selectedIndex.value !== null) {
    const selectedCell = cells.value[selectedIndex.value];
    if (selectedCell) selectedCell.status = 'active';
    selectedIndex.value = null;
  }

  cells.value.push(...newCells);
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, 100);
  
  // Можно показать уведомление, что числа добавлены
  showToast(`Добавлено ${newCells.length} цифр`);
};
</script>

<style scoped>
/* Структура экрана игры */
.screen-game {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Шапка */
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(8px);
}

.stats {
  font-size: 1.2rem;
  color: #374151;
  font-weight: 700;
}

/* Сетка */
.grid-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  width: 100%;
  box-sizing: border-box;
}

.grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 4px;
  width: 100%;
  max-width: 500px; 
}

/* Ячейки */
.cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem; 
  font-weight: 600;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #111827;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  transition: all 0.15s ease-out;
}

.cell.selected {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
  transform: scale(0.95);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  z-index: 2;
}

.cell.crossed {
  background-color: transparent;
  color: #d1d5db;
  border-color: transparent;
  text-decoration: line-through;
  cursor: default;
}

.cell.hint {
  background-color: #fde047;
  color: #854d0e;
  border-color: #eab308;
  animation: pulse 1s infinite;
  z-index: 3;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Управление (Подвал) */
.controls {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 12px 16px 20px 16px;
  background: white;
  border-top: 1px solid #f3f4f6;
  z-index: 20;
  display: flex;
  justify-content: center;
  gap: 12px;
  box-sizing: border-box;
}

.spacer { height: 100px; width: 100%; }

.win-message {
  margin: 30px 0;
  font-size: 2rem;
  color: #10b981;
  font-weight: 800;
  text-align: center;
}

/* Адаптация для ПК */
@media (min-width: 768px) {
  .grid { gap: 8px; max-width: 600px; }
  .cell { font-size: 1.5rem; border-radius: 12px; }
  .cell:hover:not(.crossed):not(.selected):not(.hint) {
    background-color: #eff6ff;
    border-color: #bfdbfe;
    transform: translateY(-1px);
  }
  .controls { padding-bottom: 12px; }
}
</style>