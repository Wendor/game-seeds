// src/workers/bot.worker.ts
import type { Cell } from '../types';

// === Типы для отката действий ===
interface LinkChange {
    index: number;
    field: 'prev' | 'next';
    oldValue: number | null | undefined;
}

// === Вспомогательные функции ===

const isHorizontalNeighbor = (cells: Cell[], idx1: number, idx2: number): boolean => {
    const c1 = cells[idx1];
    if (!c1) return false;
    return c1.next === idx2 || c1.prev === idx2;
};

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

const canMatch = (cells: Cell[], idx1: number, idx2: number): boolean => {
    const c1 = cells[idx1];
    const c2 = cells[idx2];

    if (!c1 || !c2) return false;
    if (c1.status === 'crossed' || c2.status === 'crossed') return false;
    if (c1.value !== c2.value && c1.value + c2.value !== 10) return false;

    return isHorizontalNeighbor(cells, idx1, idx2) || isVerticalNeighbor(cells, idx1, idx2);
};

const findNeighbors = (cells: Cell[], index: number): number[] => {
    const neighbors: number[] = [];
    const cell = cells[index];
    if (!cell) return [];

    if (cell.prev !== null && cell.prev !== undefined) neighbors.push(cell.prev);
    if (cell.next !== null && cell.next !== undefined) neighbors.push(cell.next);

    const len = cells.length;
    const ROW_SIZE = 9;

    for (let i = index + ROW_SIZE; i < len; i += ROW_SIZE) {
        const c = cells[i];
        if (c && c.status !== 'crossed') {
            neighbors.push(i);
            break;
        }
    }
    for (let i = index - ROW_SIZE; i >= 0; i -= ROW_SIZE) {
        const c = cells[i];
        if (c && c.status !== 'crossed') {
            neighbors.push(i);
            break;
        }
    }

    return neighbors;
};

// === Логика оценки хода (Эвристика) ===

const evaluateMove = (cells: Cell[], idx1: number, idx2: number): number => {
    const c1 = cells[idx1];
    const c2 = cells[idx2];

    // FIX: Проверка на существование
    if (!c1 || !c2) return 0;

    let score = 10;

    const isVertical = (idx1 % 9) === (idx2 % 9);

    if (isVertical) score += 100;
    if (c1.value === c2.value) score += 15;
    score -= (idx1 * 0.005);

    return score;
};

// === Логика симуляции (Apply / Undo) ===

const applyMove = (cells: Cell[], idx1: number, idx2: number): LinkChange[] => {
    const changes: LinkChange[] = [];
    const c1 = cells[idx1];
    const c2 = cells[idx2];

    // FIX: Проверка на существование
    if (!c1 || !c2) return [];

    // Временно зачеркиваем
    c1.status = 'crossed';
    c2.status = 'crossed';

    // Обработка c1
    if (c1.prev !== null && c1.prev !== undefined) {
        const prevCell = cells[c1.prev];
        if (prevCell) {
            changes.push({ index: c1.prev, field: 'next', oldValue: prevCell.next });
            prevCell.next = c1.next;
        }
    }
    if (c1.next !== null && c1.next !== undefined) {
        const nextCell = cells[c1.next];
        if (nextCell) {
            changes.push({ index: c1.next, field: 'prev', oldValue: nextCell.prev });
            nextCell.prev = c1.prev;
        }
    }

    // Обработка c2
    if (c2.prev !== null && c2.prev !== undefined) {
        const prevCell = cells[c2.prev];
        if (prevCell) {
            changes.push({ index: c2.prev, field: 'next', oldValue: prevCell.next });
            prevCell.next = c2.next;
        }
    }
    if (c2.next !== null && c2.next !== undefined) {
        const nextCell = cells[c2.next];
        if (nextCell) {
            changes.push({ index: c2.next, field: 'prev', oldValue: nextCell.prev });
            nextCell.prev = c2.prev;
        }
    }

    return changes;
};

const undoMove = (cells: Cell[], idx1: number, idx2: number, changes: LinkChange[]) => {
    // FIX: Безопасный доступ к ячейкам
    if (cells[idx1]) cells[idx1].status = 'active';
    if (cells[idx2]) cells[idx2].status = 'active';

    for (let i = changes.length - 1; i >= 0; i--) {
        const change = changes[i];
        // FIX: Проверка change
        if (!change) continue;

        const cell = cells[change.index];
        if (cell) {
            // @ts-ignore
            cell[change.field] = change.oldValue;
        }
    }
};

// === Рекурсивный поиск (Beam Search) ===

interface Move {
    idx1: number;
    idx2: number;
    score: number;
}

const findAllMoves = (cells: Cell[], limit: number = -1): Move[] => {
    const moves: Move[] = [];
    const len = cells.length;
    // Лимит итераций для очень больших полей
    const iterLimit = len > 3000 ? 2500 : len;

    for (let i = 0; i < iterLimit; i++) {
        const currentCell = cells[i];
        if (!currentCell || currentCell.status === 'crossed') continue;

        const neighbors = findNeighbors(cells, i);
        for (const nIdx of neighbors) {
            if (nIdx > i && canMatch(cells, i, nIdx)) {
                const score = evaluateMove(cells, i, nIdx);
                moves.push({ idx1: i, idx2: nIdx, score });
            }
        }
    }

    moves.sort((a, b) => b.score - a.score);

    if (limit > 0 && moves.length > limit) {
        return moves.slice(0, limit);
    }
    return moves;
};

const searchBestMove = (cells: Cell[], depth: number): { score: number, move: [number, number] | null } => {
    // Берем TOP-5 лучших кандидатов
    const candidates = findAllMoves(cells, 5);

    if (candidates.length === 0) {
        return { score: 0, move: null };
    }

    let bestTotalScore = -Infinity;
    let bestMove: [number, number] | null = null;

    for (const move of candidates) {
        let currentTotal = move.score;

        if (depth > 0) {
            const changes = applyMove(cells, move.idx1, move.idx2);

            const nextResult = searchBestMove(cells, depth - 1);

            currentTotal += (nextResult.score * 0.5);

            undoMove(cells, move.idx1, move.idx2, changes);
        }

        if (currentTotal > bestTotalScore) {
            bestTotalScore = currentTotal;
            bestMove = [move.idx1, move.idx2];
        }
    }

    return { score: bestTotalScore, move: bestMove };
};

// === Точка входа ===

self.onmessage = (e: MessageEvent) => {
    const { type, cells } = e.data;

    if (type === 'find') {
        const result = searchBestMove(cells, 1);
        self.postMessage({ type: 'moveFound', move: result.move });
    }
};