import { ref } from 'vue';
import type { Cell, GameMode, CellStatus } from '../types';

const SEQUENCE_CLASSIC = [
    1, 2, 3, 4, 5, 6, 7, 8, 9,
    1, 1, 1, 2, 1, 3, 1, 4, 1,
    5, 1, 6, 1, 7, 1, 8, 1, 9
];

export function useGameLogic() {
    const cells = ref<Cell[]>([]);
    const nextId = ref(0);

    const rebuildLinks = () => {
        let lastActiveIndex: number | null = null;

        cells.value.forEach((cell, index) => {
            if (cell.status === 'crossed') {
                cell.prev = null;
                cell.next = null;
                return;
            }
            cell.prev = lastActiveIndex;

            if (lastActiveIndex !== null && cells.value[lastActiveIndex]) {
                cells.value[lastActiveIndex]!.next = index;
            }

            lastActiveIndex = index;
            cell.next = null;
        });
    };

    const updateLinksAfterCross = (idx1: number, idx2: number) => {
        const c1 = cells.value[idx1];
        const c2 = cells.value[idx2];
        if (!c1 || !c2) return;

        if (c1.prev !== null && c1.prev !== undefined) {
            const prevCell = cells.value[c1.prev];
            if (prevCell) prevCell.next = c1.next;
        }
        if (c1.next !== null && c1.next !== undefined) {
            const nextCell = cells.value[c1.next];
            if (nextCell) nextCell.prev = c1.prev;
        }

        if (c2.prev !== null && c2.prev !== undefined) {
            const prevCell = cells.value[c2.prev];
            if (prevCell) prevCell.next = c2.next;
        }
        if (c2.next !== null && c2.next !== undefined) {
            const nextCell = cells.value[c2.next];
            if (nextCell) nextCell.prev = c2.prev;
        }

        c1.prev = c1.next = null;
        c2.prev = c2.next = null;
    };

    const isHorizontalNeighbor = (idx1: number, idx2: number): boolean => {
        const c1 = cells.value[idx1];
        if (!c1) return false;
        return c1.next === idx2 || c1.prev === idx2;
    };

    const isVerticalNeighbor = (idx1: number, idx2: number): boolean => {
        const col1 = idx1 % 9;
        const col2 = idx2 % 9;
        if (col1 !== col2) return false;

        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);

        for (let i = start + 9; i < end; i += 9) {
            const cell = cells.value[i];
            if (cell && cell.status !== 'crossed') return false;
        }
        return true;
    };

    const canMatch = (idx1: number, idx2: number): boolean => {
        const c1 = cells.value[idx1];
        const c2 = cells.value[idx2];

        if (!c1 || !c2) return false;
        if (c1.status === 'crossed' || c2.status === 'crossed') return false;

        if (c1.value !== c2.value && c1.value + c2.value !== 10) return false;

        return isHorizontalNeighbor(idx1, idx2) || isVerticalNeighbor(idx1, idx2);
    };

    const generateCells = (mode: GameMode) => {
        nextId.value = 0;
        let newCells: Cell[] = [];

        if (mode === 'classic') {
            newCells = SEQUENCE_CLASSIC.map(n => ({ id: nextId.value++, value: n, status: 'active' }));
        } else if (mode === 'easy') {
            const numbers = [1, 2, 4, 5, 6, 8, 9];
            const values = Array.from({ length: 27 }, () => numbers[Math.floor(Math.random() * numbers.length)]!);
            newCells = values.map(n => ({ id: nextId.value++, value: n, status: 'active' }));
        } else {
            const rnd = Array.from({ length: 27 }, () => Math.floor(Math.random() * 9) + 1);
            newCells = rnd.map(n => ({ id: nextId.value++, value: n, status: 'active' }));
        }

        cells.value = newCells;
        rebuildLinks();
    };

    const restoreCells = (savedCells: Cell[], savedId: number) => {
        cells.value = savedCells;
        nextId.value = savedId;
        rebuildLinks();
    };

    const addLines = (mode: GameMode) => {
        let newValues: number[] = [];
        const activeCells = cells.value.filter(c => c.status !== 'crossed');

        if (mode === 'easy') {
            for (let i = 0; i < activeCells.length; i++) {
                const randomIndex = Math.floor(Math.random() * activeCells.length);
                const sourceCell = activeCells[randomIndex];
                const sourceValue = sourceCell ? sourceCell.value : 1;
                if (Math.random() > 0.2) {
                    const isSame = Math.random() > 0.5;
                    newValues.push(isSame ? sourceValue : (10 - sourceValue));
                } else {
                    newValues.push(sourceValue);
                }
            }
            newValues.sort(() => Math.random() - 0.5);
        } else if (mode === 'random') {
            newValues = Array.from({ length: 27 }, () => Math.floor(Math.random() * 9) + 1);
        } else {
            newValues = activeCells.map(c => c.value);
        }

        const newCells = newValues.map(n => ({
            id: nextId.value++,
            value: n,
            status: 'active' as CellStatus
        }));

        cells.value.push(...newCells);
        rebuildLinks();
        return newCells.length;
    };

    const findHint = (startIndex = 0): number[] | null => {
        const len = cells.value.length;
        for (let i = startIndex; i < len; i++) {
            const c1 = cells.value[i];
            if (!c1 || c1.status === 'crossed') continue;

            if (c1.next !== null && c1.next !== undefined) {
                if (canMatch(i, c1.next)) return [i, c1.next];
            }

            for (let j = i + 1; j < len; j++) {
                const c2 = cells.value[j];
                if (!c2 || c2.status === 'crossed') continue;
                if (canMatch(i, j)) return [i, j];
            }
        }
        return null;
    };

    const cleanEmptyRows = (): number => {
        const ROW_SIZE = 9;
        let rowsRemoved = 0;
        let hasChanges = false;

        const newCells: Cell[] = [];

        for (let i = 0; i < cells.value.length; i += ROW_SIZE) {
            const chunk = cells.value.slice(i, i + ROW_SIZE);

            const isEmptyRow = chunk.length === ROW_SIZE && chunk.every(c => c.status === 'crossed');

            if (isEmptyRow) {
                hasChanges = true;
                rowsRemoved++;
            } else {
                newCells.push(...chunk);
            }
        }

        if (hasChanges) {
            cells.value = newCells;
            rebuildLinks();
        }

        return rowsRemoved;
    };

    const findNeighbors = (index: number): number[] => {
        const neighbors: number[] = [];
        const cell = cells.value[index];
        if (!cell) return [];

        if (cell.prev !== null && cell.prev !== undefined) neighbors.push(cell.prev);
        if (cell.next !== null && cell.next !== undefined) neighbors.push(cell.next);

        const len = cells.value.length;
        const ROW_SIZE = 9;

        for (let i = index + ROW_SIZE; i < len; i += ROW_SIZE) {
            const c = cells.value[i];
            if (c && c.status !== 'crossed') {
                neighbors.push(i);
                break;
            }
        }
        for (let i = index - ROW_SIZE; i >= 0; i -= ROW_SIZE) {
            const c = cells.value[i];
            if (c && c.status !== 'crossed') {
                neighbors.push(i);
                break;
            }
        }

        return neighbors;
    };

    return {
        cells,
        nextId,
        generateCells,
        restoreCells,
        canMatch,
        addLines,
        findHint,
        cleanEmptyRows,
        findNeighbors,
        updateLinksAfterCross
    };
}