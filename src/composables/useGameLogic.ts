import { ref, toRaw } from 'vue';
import { GAME_CONFIG } from '../config';
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
        const lastSeenInColumn: (number | null)[] = new Array(GAME_CONFIG.ROW_SIZE).fill(null);
        const rawCells = toRaw(cells.value);

        rawCells.forEach((cell, index) => {
            cell.prev = null;
            cell.next = null;
            cell.up = null;
            cell.down = null;

            if (cell.status === 'crossed') return;

            cell.prev = lastActiveIndex;
            if (lastActiveIndex !== null && rawCells[lastActiveIndex]) {
                rawCells[lastActiveIndex]!.next = index;
            }
            lastActiveIndex = index;

            const col = index % GAME_CONFIG.ROW_SIZE;
            const upIndex = lastSeenInColumn[col];

            if (upIndex !== null && upIndex !== undefined && rawCells[upIndex]) {
                cell.up = upIndex;
                rawCells[upIndex]!.down = index;
            }

            lastSeenInColumn[col] = index;
        });
    };

    const updateLinksAfterCross = (idx1: number, idx2: number) => {
        const rawCells = toRaw(cells.value);
        const c1 = rawCells[idx1];
        const c2 = rawCells[idx2];

        if (!c1 || !c2) return;

        const unlinkCell = (cell: Cell) => {
            if (cell.prev !== null && cell.prev !== undefined) {
                const prev = rawCells[cell.prev];
                if (prev) prev.next = cell.next;
            }
            if (cell.next !== null && cell.next !== undefined) {
                const next = rawCells[cell.next];
                if (next) next.prev = cell.prev;
            }

            if (cell.up !== null && cell.up !== undefined) {
                const up = rawCells[cell.up];
                if (up) up.down = cell.down;
            }
            if (cell.down !== null && cell.down !== undefined) {
                const down = rawCells[cell.down];
                if (down) down.up = cell.up;
            }

            cell.prev = cell.next = cell.up = cell.down = null;
        };

        unlinkCell(c1);
        unlinkCell(c2);
    };

    const findNeighbors = (index: number): number[] => {
        const rawCells = toRaw(cells.value);
        const cell = rawCells[index];
        if (!cell) return [];

        const neighbors: number[] = [];

        if (cell.prev !== null && cell.prev !== undefined) neighbors.push(cell.prev);
        if (cell.next !== null && cell.next !== undefined) neighbors.push(cell.next);

        if (cell.up !== null && cell.up !== undefined && !neighbors.includes(cell.up)) {
            neighbors.push(cell.up);
        }
        if (cell.down !== null && cell.down !== undefined && !neighbors.includes(cell.down)) {
            neighbors.push(cell.down);
        }

        return neighbors;
    };

    const isHorizontalNeighbor = (idx1: number, idx2: number): boolean => {
        const c = toRaw(cells.value[idx1]);
        return !!c && (c.next === idx2 || c.prev === idx2);
    };

    const isVerticalNeighbor = (idx1: number, idx2: number): boolean => {
        const c = toRaw(cells.value[idx1]);
        return !!c && (c.down === idx2 || c.up === idx2);
    };

    const canMatch = (idx1: number, idx2: number): boolean => {
        const c1 = cells.value[idx1];
        const c2 = cells.value[idx2];

        if (!c1 || !c2) return false;
        if (c1.status === 'crossed' || c2.status === 'crossed') return false;

        if (c1.value !== c2.value && c1.value + c2.value !== 10) return false;

        return isHorizontalNeighbor(idx1, idx2) || isVerticalNeighbor(idx1, idx2);
    };

    const generateCells = (mode: GameMode, levelPattern?: string[]) => {
        nextId.value = 0;
        let newCells: Cell[] = [];

        if (mode === 'levels' && levelPattern) {
            levelPattern.forEach(rowStr => {
                const paddedRow = rowStr.padEnd(GAME_CONFIG.ROW_SIZE, ' ').slice(0, GAME_CONFIG.ROW_SIZE);
                for (const char of paddedRow) {
                    const num = parseInt(char);
                    if (!isNaN(num) && num > 0) {
                        newCells.push({ id: nextId.value++, value: num, status: 'active' });
                    } else {
                        newCells.push({ id: nextId.value++, value: 0, status: 'crossed' });
                    }
                }
            });
        } else if (mode === 'classic') {
            newCells = SEQUENCE_CLASSIC.map(n => ({ id: nextId.value++, value: n, status: 'active' }));
        } else if (mode === 'easy') {
            const numbers = [1, 2, 4, 5, 6, 8, 9];
            const values = Array.from({ length: GAME_CONFIG.ROW_SIZE * 3 }, () => numbers[Math.floor(Math.random() * numbers.length)]!);
            newCells = values.map(n => ({ id: nextId.value++, value: n, status: 'active' }));
        } else {
            const rnd = Array.from({ length: GAME_CONFIG.ROW_SIZE * 3 }, () => Math.floor(Math.random() * 9) + 1);
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
        const activeCells = cells.value.filter(c => c.status !== 'crossed' && c.value !== 0);

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
            newValues = Array.from({ length: GAME_CONFIG.ROW_SIZE * 3 }, () => Math.floor(Math.random() * 9) + 1);
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
        // ВАЖНО: Возвращаем ID, а не просто длину
        return newCells.map(c => c.id);
    };

    const findHint = (startIndex = 0): number[] | null => {
        const rawCells = toRaw(cells.value);
        const len = rawCells.length;

        for (let i = startIndex; i < len; i++) {
            const c1 = rawCells[i];
            if (!c1 || c1.status === 'crossed') continue;

            if (c1.next !== null && c1.next !== undefined) {
                if (canMatch(i, c1.next)) return [i, c1.next];
            }
            if (c1.down !== null && c1.down !== undefined) {
                if (canMatch(i, c1.down)) return [i, c1.down];
            }
        }
        return null;
    };

    const cleanEmptyRows = (): number => {
        const ROW_SIZE = GAME_CONFIG.ROW_SIZE;
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
        updateLinksAfterCross,
        rebuildLinks,
    };
}