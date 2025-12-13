import { ref, toRaw } from 'vue';
import { GAME_CONFIG } from '../config';
import type { Cell, GameMode, CellStatus } from '../types';
import { canMatch as ruleCanMatch, findNeighbors as ruleFindNeighbors } from '../utils/gameRules';

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
        return ruleFindNeighbors(toRaw(cells.value), index);
    };

    const canMatch = (idx1: number, idx2: number): boolean => {
        return ruleCanMatch(toRaw(cells.value), idx1, idx2);
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
        return newCells.map(c => c.id);
    };

    const findHint = (startIndex = 0): number[] | null => {
        const rawCells = toRaw(cells.value);
        const len = rawCells.length;

        for (let i = startIndex; i < len; i++) {
            const c1 = rawCells[i];
            if (!c1 || c1.status === 'crossed') continue;

            // Hint logic can rely on neighbors logic
            const neighbors = findNeighbors(i);
            for (const nIdx of neighbors) {
                if (nIdx > i && canMatch(i, nIdx)) {
                    return [i, nIdx];
                }
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

    const shuffleBoard = () => {
        const rawCells = toRaw(cells.value);
        const activeIndices: number[] = [];
        const activeValues: number[] = [];

        rawCells.forEach((cell, index) => {
            if (cell.status !== 'crossed') {
                activeIndices.push(index);
                activeValues.push(cell.value);
            }
        });

        for (let i = activeValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = activeValues[i]!;
            activeValues[i] = activeValues[j]!;
            activeValues[j] = temp;
        }

        activeIndices.forEach((cellIndex, i) => {
            const newVal = activeValues[i];
            const targetCell = cells.value[cellIndex];

            if (targetCell && newVal !== undefined) {
                targetCell.value = newVal;
            }
        });

        rebuildLinks();
    };

    const addRandomRow = () => {
        const existingValues = new Set<number>();
        cells.value.forEach(cell => {
            if (cell.status !== 'crossed') {
                existingValues.add(cell.value);
            }
        });

        const sourceNumbers = existingValues.size > 0
            ? Array.from(existingValues)
            : [1, 2, 3, 4, 5, 6, 7, 8, 9];

        const newValues = Array.from({ length: 9 }, () => {
            const randomIndex = Math.floor(Math.random() * sourceNumbers.length);
            return sourceNumbers[randomIndex]!;
        });

        const newCells = newValues.map(n => ({
            id: nextId.value++,
            value: n,
            status: 'active' as CellStatus
        }));

        cells.value.push(...newCells);
        rebuildLinks();
        return newCells.map(c => c.id);
    };

    const destroyCell = (index: number) => {
        const cell = cells.value[index];
        if (cell && cell.status !== 'crossed') {
            cell.status = 'crossed';
            rebuildLinks();
            return true;
        }
        return false;
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
        shuffleBoard,
        addRandomRow,
        destroyCell
    };
}