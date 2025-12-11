import { type Ref } from 'vue';
import type { Cell } from '../types';

interface CellStylingDeps {
    isBotActive: Ref<boolean>;
    neighborIndices: Ref<number[]>;
    selectedIndex: Ref<number | null>;
    hintIndices: Ref<number[]>;
    canMatch: (idx1: number, idx2: number) => boolean;
}

export function useCellStyling(deps: CellStylingDeps) {
    const { isBotActive, neighborIndices, selectedIndex, hintIndices, canMatch } = deps;

    // Определение цветовой группы (для CSS переменных)
    const getGroupClass = (val: number) => {
        if (val === 1 || val === 9) return 'cell-group-1';
        if (val === 2 || val === 8) return 'cell-group-2';
        if (val === 3 || val === 7) return 'cell-group-3';
        if (val === 4 || val === 6) return 'cell-group-4';
        if (val === 5) return 'cell-group-5';
        return '';
    };

    // Хелперы для проверки соседей (используются и в шаблоне для призраков)
    const isNeighbor = (index: number) => neighborIndices.value.includes(index);

    const isMatchable = (index: number) => {
        return selectedIndex.value !== null
            && neighborIndices.value.includes(index)
            && canMatch(selectedIndex.value, index);
    };

    // Главная функция классов
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

        // Если играет бот, не показываем подсказки для игрока
        if (isBotActive.value) return classes;

        const neighbor = isNeighbor(index);
        const matchable = neighbor && selectedIndex.value !== null && canMatch(selectedIndex.value, index);

        return {
            ...classes,
            'hint': hintIndices.value.includes(index),
            'neighbor': neighbor && !matchable,
            'neighbor-match': matchable
        };
    };

    return {
        getGroupClass,
        getCellClasses,
        isNeighbor,
        isMatchable
    };
}