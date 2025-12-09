// src/workers/bot.worker.ts
import type { Cell } from '../types';

// === Вспомогательная логика (копия логики из useGameLogic) ===

// Проверка: являются ли ячейки соседями по горизонтали
const isHorizontalNeighbor = (cells: Cell[], idx1: number, idx2: number): boolean => {
    const c1 = cells[idx1];
    if (!c1) return false;
    return c1.next === idx2 || c1.prev === idx2;
};

// Проверка: являются ли ячейки соседями по вертикали
const isVerticalNeighbor = (cells: Cell[], idx1: number, idx2: number): boolean => {
    const col1 = idx1 % 9;
    const col2 = idx2 % 9;
    if (col1 !== col2) return false;

    const start = Math.min(idx1, idx2);
    const end = Math.max(idx1, idx2);

    for (let i = start + 9; i < end; i += 9) {
        const cell = cells[i];
        if (cell && cell.status !== 'crossed') return false;
    }
    return true;
};

// Можно ли объединить пару
const canMatch = (cells: Cell[], idx1: number, idx2: number): boolean => {
    const c1 = cells[idx1];
    const c2 = cells[idx2];

    if (!c1 || !c2) return false;
    if (c1.status === 'crossed' || c2.status === 'crossed') return false;
    if (c1.value !== c2.value && c1.value + c2.value !== 10) return false;

    return isHorizontalNeighbor(cells, idx1, idx2) || isVerticalNeighbor(cells, idx1, idx2);
};

// Поиск всех активных соседей для клетки
const findNeighbors = (cells: Cell[], index: number): number[] => {
    const neighbors: number[] = [];
    const cell = cells[index];
    if (!cell) return [];

    // Горизонтальные (по ссылкам)
    if (cell.prev !== null && cell.prev !== undefined) neighbors.push(cell.prev);
    if (cell.next !== null && cell.next !== undefined) neighbors.push(cell.next);

    // Вертикальные (по сетке)
    const len = cells.length;
    const ROW_SIZE = 9;

    // Вниз
    for (let i = index + ROW_SIZE; i < len; i += ROW_SIZE) {
        const c = cells[i];
        if (c && c.status !== 'crossed') {
            neighbors.push(i);
            break;
        }
    }
    // Вверх
    for (let i = index - ROW_SIZE; i >= 0; i -= ROW_SIZE) {
        const c = cells[i];
        if (c && c.status !== 'crossed') {
            neighbors.push(i);
            break;
        }
    }

    return neighbors;
};

// Хелперы для оценки хода
const findPrevActive = (cells: Cell[], index: number): number | null => {
    const cell = cells[index];
    if (cell && cell.prev !== undefined && cell.prev !== null) return cell.prev;
    for (let i = index - 1; i >= 0; i--) {
        const c = cells[i];
        if (c && c.status !== 'crossed') return i;
    }
    return null;
};

const findNextActive = (cells: Cell[], index: number): number | null => {
    const cell = cells[index];
    if (cell && cell.next !== undefined && cell.next !== null) return cell.next;
    for (let i = index + 1; i < cells.length; i++) {
        const c = cells[i];
        if (c && c.status !== 'crossed') return i;
    }
    return null;
};

const checkValuesMatch = (c1: Cell, c2: Cell) => {
    return c1.value === c2.value || c1.value + c2.value === 10;
};

// === Основная тяжелая функция ===
const findBestMove = (cells: Cell[]): [number, number] | null => {
    const len = cells.length;
    // Лимит поиска можно увеличить, так как мы в воркере и не блокируем UI
    const searchLimit = len > 3000 ? 2500 : len;
    const allMoves: { idx1: number, idx2: number, score: number }[] = [];

    for (let i = 0; i < searchLimit; i++) {
        const currentCell = cells[i];
        if (!currentCell || currentCell.status === 'crossed') continue;

        const neighbors = findNeighbors(cells, i);

        for (const nIdx of neighbors) {
            // Проверяем только nIdx > i, чтобы не дублировать пары
            if (nIdx > i && canMatch(cells, i, nIdx)) {
                const neighborCell = cells[nIdx];
                if (!neighborCell) continue;

                // --- Подсчет очков (логика из старого useBot) ---
                let score = 10;
                const isVertical = (i % 9) === (nIdx % 9);

                if (isVertical) score += 150; // Приоритет вертикальным, чтобы чистить ряды
                if (currentCell.value === neighborCell.value) score += 20;

                // Бонус за "цепную реакцию" (если удаление соединит одинаковые числа)
                if (!isVertical) {
                    const prev = findPrevActive(cells, i);
                    const next = findNextActive(cells, nIdx);
                    if (prev !== null && next !== null) {
                        const cPrev = cells[prev];
                        const cNext = cells[next];
                        if (cPrev && cNext && checkValuesMatch(cPrev, cNext)) score += 500;
                    }
                }

                // Штраф за позицию (чем дальше, тем меньше приоритет), чтобы бот шел сверху вниз
                score -= (i * 0.001);

                allMoves.push({ idx1: i, idx2: nIdx, score });
            }
        }
    }

    if (allMoves.length === 0) return null;

    allMoves.sort((a, b) => b.score - a.score);

    const bestMove = allMoves[0];
    if (!bestMove) return null;

    return [bestMove.idx1, bestMove.idx2];
};

// === Обработка сообщений ===
self.onmessage = (e: MessageEvent) => {
    const { type, cells } = e.data;

    if (type === 'find') {
        const move = findBestMove(cells);
        // Отправляем результат обратно
        self.postMessage({ type: 'moveFound', move });
    }
};