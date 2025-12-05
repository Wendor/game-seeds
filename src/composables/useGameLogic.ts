import { ref } from 'vue';
import type { Cell, GameMode, CellStatus } from '../types';

const SEQUENCE_CLASSIC = [
    1, 2, 3, 4, 5, 6, 7, 8, 9,
    1, 0, 1, 1, 1, 2, 1, 3, 1, 4,
    1, 5, 1, 6, 1, 7, 1, 8, 1, 9
];

export function useGameLogic() {
    const cells = ref<Cell[]>([]);
    // Исправление: делаем ref, чтобы значение обновлялось везде
    const nextId = ref(0);

    // --- Helpers ---
    const isHorizontalNeighbor = (idx1: number, idx2: number): boolean => {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        for (let i = start + 1; i < end; i++) {
            const cell = cells.value[i];
            // Исправление: проверка на существование cell
            if (cell && cell.status !== 'crossed') return false;
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
            const cell = cells.value[i];
            // Исправление: проверка на существование cell
            if (cell && cell.status !== 'crossed') return false;
        }
        return true;
    };

    // --- Core Checks ---
    const canMatch = (idx1: number, idx2: number): boolean => {
        const c1 = cells.value[idx1];
        const c2 = cells.value[idx2];

        // Исправление: строгая проверка на undefined
        if (!c1 || !c2) return false;
        if (c1.status === 'crossed' || c2.status === 'crossed') return false;

        if (c1.value !== c2.value && c1.value + c2.value !== 10) return false;

        return isHorizontalNeighbor(idx1, idx2) || isVerticalNeighbor(idx1, idx2);
    };

    // --- Actions ---
    const generateCells = (mode: GameMode) => {
        nextId.value = 0;
        if (mode === 'classic') {
            cells.value = SEQUENCE_CLASSIC.map(n => ({ id: nextId.value++, value: n, status: 'active' }));
        } else {
            const rnd = Array.from({ length: 36 }, () => Math.floor(Math.random() * 9) + 1);
            cells.value = rnd.map(n => ({ id: nextId.value++, value: n, status: 'active' }));
        }
    };

    const restoreCells = (savedCells: Cell[], savedId: number) => {
        cells.value = savedCells;
        nextId.value = savedId;
    };

    const addLines = () => {
        const active = cells.value
            .filter(c => c.status !== 'crossed')
            .map(c => c.value);

        const newCells = active.map(n => ({
            id: nextId.value++,
            value: n,
            status: 'active' as CellStatus
        }));

        cells.value.push(...newCells);
        return newCells.length;
    };

    // --- Hint Logic ---
    const findHint = (startIndex = 0): number[] | null => {
        const len = cells.value.length;
        for (let i = startIndex; i < len; i++) {
            const c1 = cells.value[i];
            // Исправление: проверка c1 перед использованием
            if (!c1 || c1.status === 'crossed') continue;

            for (let j = i + 1; j < len; j++) {
                const c2 = cells.value[j];
                // Исправление: проверка c2
                if (!c2 || c2.status === 'crossed') continue;

                if (canMatch(i, j)) return [i, j];
            }
        }
        return null;
    };

    return {
        cells,
        nextId,
        generateCells,
        restoreCells,
        canMatch,
        addLines,
        findHint
    };
}