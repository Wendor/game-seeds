import { ref, type Ref } from 'vue';
import type { Cell } from '../types';
import { useI18n } from './useI18n';
import type { SoundName } from '../utils/audio';
import type { HapticService } from '../utils/haptics';

interface PlayerDeps {
    cells: Ref<Cell[]>;
    gameActions: {
        canMatch: (idx1: number, idx2: number) => boolean;
        findNeighbors: (index: number) => number[];
        cleanEmptyRows: () => number | void;
        updateLinksAfterCross: (idx1: number, idx2: number) => void;
    };
    historyActions: {
        recordMatch: (indices: number[]) => void;
        recordClean: () => void;
        popHistory: () => void;
    };
    uiActions: {
        playSound: (name: SoundName) => void;
        showToast: (msg: string) => void;
        haptic: HapticService;
        clearHintUI: () => void;
    };
    state: {
        isBotActive: Ref<boolean>;
    };
}

export function usePlayer(deps: PlayerDeps) {
    const { cells, gameActions, historyActions, uiActions, state } = deps;
    const { t } = useI18n();

    const selectedIndex = ref<number | null>(null);
    const neighborIndices = ref<number[]>([]);

    const resetSelection = () => {
        if (selectedIndex.value !== null) {
            const cell = cells.value[selectedIndex.value];
            if (cell) {
                cell.status = 'active';
            }
        }
        selectedIndex.value = null;
        neighborIndices.value = [];
    };

    // Добавлен аргумент byBot
    const handleCellClick = (index: number, byBot: boolean = false) => {
        // Если бот активен, и клик НЕ от бота - блокируем
        if (state.isBotActive.value && !byBot) return;

        uiActions.clearHintUI();
        neighborIndices.value = [];

        const cell = cells.value[index];
        if (!cell || cell.status === 'crossed') return;

        if (selectedIndex.value === null) {
            uiActions.playSound('select');
            cell.status = 'selected';
            selectedIndex.value = index;
            neighborIndices.value = gameActions.findNeighbors(index);
            return;
        }

        if (selectedIndex.value === index) {
            cell.status = 'active';
            selectedIndex.value = null;
            return;
        }

        const prevIndex = selectedIndex.value;
        const prevCell = cells.value[prevIndex];

        if (prevCell && gameActions.canMatch(prevIndex, index)) {
            historyActions.recordMatch([prevIndex, index]);
            uiActions.playSound('match');
            uiActions.haptic.success();

            prevCell.status = 'crossed';
            cell.status = 'crossed';
            selectedIndex.value = null;

            gameActions.updateLinksAfterCross(prevIndex, index);

            historyActions.recordClean();
            const result = gameActions.cleanEmptyRows();

            if (typeof result === 'number') {
                if (result > 0) {
                    uiActions.playSound('add');
                } else {
                    historyActions.popHistory();
                }
            }
            else {
                historyActions.popHistory();
            }

        } else {
            uiActions.playSound('error');
            uiActions.haptic.medium();

            if (prevCell) prevCell.status = 'active';
            cell.status = 'selected';
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