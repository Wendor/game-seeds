import { ref, type Ref } from 'vue';
import type { Cell } from '../types';

interface PlayerDeps {
    cells: Ref<Cell[]>;
    gameActions: {
        canMatch: (idx1: number, idx2: number) => boolean;
        findNeighbors: (index: number) => number[];
        cleanEmptyRows: () => number;
    };
    historyActions: {
        recordMatch: (indices: number[]) => void;
        recordClean: () => void;
        popHistory: () => void;
    };
    uiActions: {
        playSound: (name: any) => void;
        showToast: (msg: string) => void;
        haptic: any;
        clearHintUI: () => void;
    };
    state: {
        isBotActive: Ref<boolean>;
    };
}

export function usePlayer(deps: PlayerDeps) {
    const { cells, gameActions, historyActions, uiActions, state } = deps;

    const selectedIndex = ref<number | null>(null);
    const neighborIndices = ref<number[]>([]);

    const resetSelection = () => {
        if (selectedIndex.value !== null) {
            // ИСПРАВЛЕНИЕ: Сохраняем ячейку в переменную, чтобы TS видел проверку
            const cell = cells.value[selectedIndex.value];
            if (cell) {
                cell.status = 'active';
            }
        }
        selectedIndex.value = null;
        neighborIndices.value = [];
    };

    const handleCellClick = (index: number) => {
        // Если играет бот — игрок не может вмешиваться
        if (state.isBotActive.value) return;

        uiActions.clearHintUI();
        neighborIndices.value = [];

        const cell = cells.value[index];
        if (!cell || cell.status === 'crossed') return;

        // 1. Если ничего не выбрано — выбираем
        if (selectedIndex.value === null) {
            uiActions.playSound('select');
            cell.status = 'selected';
            selectedIndex.value = index;
            neighborIndices.value = gameActions.findNeighbors(index);
            return;
        }

        // 2. Если кликнули по уже выбранной — отменяем выбор
        if (selectedIndex.value === index) {
            cell.status = 'active';
            selectedIndex.value = null;
            return;
        }

        // 3. Попытка составить пару
        const prevIndex = selectedIndex.value;
        const prevCell = cells.value[prevIndex];

        if (prevCell && gameActions.canMatch(prevIndex, index)) {
            // Успешная пара
            historyActions.recordMatch([prevIndex, index]);
            uiActions.playSound('match');
            uiActions.haptic.success();

            prevCell.status = 'crossed';
            cell.status = 'crossed';
            selectedIndex.value = null;

            // Отложенная очистка строк
            setTimeout(() => {
                historyActions.recordClean();
                const removedCount = gameActions.cleanEmptyRows();

                if (removedCount > 0) {
                    uiActions.showToast(removedCount === 1 ? 'Ряд очищен!' : `Убрано рядов: ${removedCount}`);
                    uiActions.playSound('add');
                } else {
                    historyActions.popHistory();
                }
            }, 300);

        } else {
            // Ошибка (не пара)
            uiActions.playSound('error');
            uiActions.haptic.medium();

            if (prevCell) prevCell.status = 'active'; // Сбрасываем старую
            cell.status = 'selected'; // Выбираем новую
            selectedIndex.value = index;
            neighborIndices.value = gameActions.findNeighbors(index);
        }
    };

    return {
        selectedIndex,
        neighborIndices,
        handleCellClick,
        resetSelection
    };
}