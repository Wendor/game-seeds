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

    // --- Linked List Helpers (Оптимизация) ---

    // Пересчет связей для ВСЕГО поля (вызывать при старте, загрузке или очистке строк)
    const rebuildLinks = () => {
        let lastActiveIndex: number | null = null;

        cells.value.forEach((cell, index) => {
            if (cell.status === 'crossed') {
                cell.prev = null;
                cell.next = null;
                return;
            }

            // Связываем текущую с предыдущей активной
            cell.prev = lastActiveIndex;

            // Если была предыдущая, связываем её с текущей
            if (lastActiveIndex !== null && cells.value[lastActiveIndex]) {
                cells.value[lastActiveIndex]!.next = index;
            }

            lastActiveIndex = index;
            cell.next = null; // Пока не знаем следующего
        });
    };

    // Обновление связей при зачеркивании ОДНОЙ пары (быстро)
    const updateLinksAfterCross = (idx1: number, idx2: number) => {
        const c1 = cells.value[idx1];
        const c2 = cells.value[idx2];
        if (!c1 || !c2) return;

        // "Сшиваем" разрыв вокруг idx1
        if (c1.prev !== null && c1.prev !== undefined) {
            const prevCell = cells.value[c1.prev];
            if (prevCell) prevCell.next = c1.next;
        }
        if (c1.next !== null && c1.next !== undefined) {
            const nextCell = cells.value[c1.next];
            if (nextCell) nextCell.prev = c1.prev;
        }

        // "Сшиваем" разрыв вокруг idx2
        if (c2.prev !== null && c2.prev !== undefined) {
            const prevCell = cells.value[c2.prev];
            if (prevCell) prevCell.next = c2.next;
        }
        if (c2.next !== null && c2.next !== undefined) {
            const nextCell = cells.value[c2.next];
            if (nextCell) nextCell.prev = c2.prev;
        }

        // Сами ячейки отключаем от списка
        c1.prev = c1.next = null;
        c2.prev = c2.next = null;
    };

    // --- Helpers ---

    // Теперь проверка горизонтального соседа мгновенная!
    const isHorizontalNeighbor = (idx1: number, idx2: number): boolean => {
        const c1 = cells.value[idx1];
        if (!c1) return false;
        // Либо c1.next указывает на idx2, либо c1.prev указывает на idx2
        return c1.next === idx2 || c1.prev === idx2;
    };

    const isVerticalNeighbor = (idx1: number, idx2: number): boolean => {
        const col1 = idx1 % 9;
        const col2 = idx2 % 9;
        if (col1 !== col2) return false;

        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);

        // Для вертикали все еще нужен цикл, но мы прыгаем по 9
        for (let i = start + 9; i < end; i += 9) {
            const cell = cells.value[i];
            if (cell && cell.status !== 'crossed') return false; // Есть препятствие
        }
        return true;
    };

    // --- Core Checks ---
    const canMatch = (idx1: number, idx2: number): boolean => {
        const c1 = cells.value[idx1];
        const c2 = cells.value[idx2];

        if (!c1 || !c2) return false;
        if (c1.status === 'crossed' || c2.status === 'crossed') return false;

        if (c1.value !== c2.value && c1.value + c2.value !== 10) return false;

        return isHorizontalNeighbor(idx1, idx2) || isVerticalNeighbor(idx1, idx2);
    };

    // --- Actions ---
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
        rebuildLinks(); // <--- Важно: строим связи
    };

    const restoreCells = (savedCells: Cell[], savedId: number) => {
        cells.value = savedCells;
        nextId.value = savedId;
        rebuildLinks(); // <--- Важно: восстанавливаем связи после загрузки
    };

    const addLines = (mode: GameMode) => {
        // ... (код генерации newValues тот же, что был) ...
        // Копируй логику из старого файла для newValues
        let newValues: number[] = [];
        const activeCells = cells.value.filter(c => c.status !== 'crossed');

        if (mode === 'easy') {
            // ... старая логика easy ...
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
        rebuildLinks(); // <--- Перестраиваем, так как добавили в конец
        return newCells.length;
    };

    // Теперь findHint работает молниеносно для горизонталей
    const findHint = (startIndex = 0): number[] | null => {
        // Используем связи для быстрого прохода
        let currentIdx = startIndex;

        // Если startIndex попал на crossed, ищем первого живого
        if (cells.value[currentIdx]?.status === 'crossed') {
            // Тут можно было бы использовать .next, но для надежности в hints проход по массиву ок, 
            // так как hint вызывается редко. 
            // Но для бота лучше использовать проход по .next
        }

        const len = cells.value.length;
        // Оптимизированный поиск не делаем, чтобы не усложнять код чтения Hints
        // (Оставим старый цикл, но используем быструю canMatch)
        for (let i = startIndex; i < len; i++) {
            const c1 = cells.value[i];
            if (!c1 || c1.status === 'crossed') continue;

            // Оптимизация: сначала проверяем "связного" соседа (горизонталь)
            if (c1.next !== null && c1.next !== undefined) {
                if (canMatch(i, c1.next)) return [i, c1.next];
            }

            // Потом вертикаль и дальних (если логика позволяет "разрывы" в Hint)
            // В классике hint ищет любую пару.
            // Для скорости можно оставить полный перебор только для Vertical

            for (let j = i + 1; j < len; j++) {
                // Тут можно добавить пропуск, если j далеко и не вертикаль
                const c2 = cells.value[j];
                if (!c2 || c2.status === 'crossed') continue;
                if (canMatch(i, j)) return [i, j];
            }
        }
        return null;
    };

    const cleanEmptyRows = (): number => {
        // ... старый код cleanEmptyRows ...
        const ROW_SIZE = 9;
        let rowsRemoved = 0;
        const newCells: Cell[] = [];
        let hasChanges = false;

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
            rebuildLinks(); // <--- ОБЯЗАТЕЛЬНО: индексы сместились, нужно перелинковать всё
        }

        return rowsRemoved;
    };

    const findNeighbors = (index: number): number[] => {
        const neighbors: number[] = [];
        const cell = cells.value[index];
        if (!cell) return [];

        // 1. Быстрые горизонтальные соседи через Linked List
        if (cell.prev !== null && cell.prev !== undefined) neighbors.push(cell.prev);
        if (cell.next !== null && cell.next !== undefined) neighbors.push(cell.next);

        // 2. Вертикальные (тут старый метод, т.к. колонок всего 9)
        const len = cells.value.length;
        const ROW_SIZE = 9;

        // DOWN
        for (let i = index + ROW_SIZE; i < len; i += ROW_SIZE) {
            const c = cells.value[i];
            if (c && c.status !== 'crossed') {
                neighbors.push(i);
                break;
            }
        }
        // UP
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
        updateLinksAfterCross // <--- Экспортируем, чтобы вызвать при ходе
    };
}