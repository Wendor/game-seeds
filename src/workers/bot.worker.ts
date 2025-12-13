import { GAME_CONFIG } from '../config';
import type { Cell } from '../types';
import { canMatch, findNeighbors, isHorizontalNeighbor } from '../utils/gameRules';

const ROW_SIZE = GAME_CONFIG.ROW_SIZE;

interface LinkChange {
    index: number;
    field: 'prev' | 'next';
    oldValue: number | null | undefined;
}

const findBlockingCell = (cells: Cell[], idx1: number, idx2: number): number => {
    const c1 = cells[idx1];
    const c2 = cells[idx2];
    if (!c1 || !c2) return -1;

    if (c1.next !== null && c1.next !== undefined) {
        const blockIdx = c1.next;
        const blockCell = cells[blockIdx];
        if (blockCell && blockCell.status !== 'crossed' && blockCell.next === idx2) {
            return blockIdx;
        }
    }

    const col1 = idx1 % ROW_SIZE;
    const col2 = idx2 % ROW_SIZE;

    if (col1 === col2) {
        const start = Math.min(idx1, idx2);
        const end = Math.max(idx1, idx2);
        let activeCount = 0;
        let lastActiveIdx = -1;

        for (let i = start + ROW_SIZE; i < end; i += ROW_SIZE) {
            const cell = cells[i];
            if (cell && cell.status !== 'crossed') {
                activeCount++;
                lastActiveIdx = i;
            }
        }

        if (activeCount === 1) {
            return lastActiveIdx;
        }
    }

    return -1;
};

const findHammerMove = (cells: Cell[]): number | null => {
    const len = cells.length;
    const limit = Math.min(len, 2000);

    for (let i = 0; i < limit; i++) {
        const c1 = cells[i];
        if (!c1 || c1.status === 'crossed') continue;

        const scanLimit = Math.min(len, i + 200);
        for (let j = i + 1; j < scanLimit; j++) {
            const c2 = cells[j];
            if (!c2 || c2.status === 'crossed') continue;

            if (c1.value === c2.value || c1.value + c2.value === 10) {
                const blocker = findBlockingCell(cells, i, j);
                if (blocker !== -1) {
                    return blocker;
                }
            }
        }
    }
    return null;
};

const evaluateMove = (cells: Cell[], idx1: number, idx2: number): number => {
    const c1 = cells[idx1];
    const c2 = cells[idx2];

    if (!c1 || !c2) return 0;

    let score = 10;

    const isVertical = (idx1 % ROW_SIZE) === (idx2 % ROW_SIZE);

    if (isVertical) score += GAME_CONFIG.SCORE.VERTICAL;
    if (c1.value === c2.value) score += GAME_CONFIG.SCORE.SAME_VALUE;
    score -= (idx1 * GAME_CONFIG.SCORE.POSITION_PENALTY);

    if (isHorizontalNeighbor(cells, idx1, idx2)) {
        const first = Math.min(idx1, idx2);
        const second = Math.max(idx1, idx2);

        const prevIdx = cells[first]!.prev;
        const nextIdx = cells[second]!.next;

        if (prevIdx !== null && prevIdx !== undefined && nextIdx !== null && nextIdx !== undefined) {
            const prev = cells[prevIdx];
            const next = cells[nextIdx];

            if (prev && next && prev.status !== 'crossed' && next.status !== 'crossed') {
                if (prev.value === next.value || prev.value + next.value === 10) {
                    score += GAME_CONFIG.SCORE.CHAIN_REACTION;
                }
            }
        }
    }

    return score;
};

const applyMove = (cells: Cell[], idx1: number, idx2: number): LinkChange[] => {
    const changes: LinkChange[] = [];
    const c1 = cells[idx1];
    const c2 = cells[idx2];

    if (!c1 || !c2) return [];

    c1.status = 'crossed';
    c2.status = 'crossed';

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
    if (cells[idx1]) cells[idx1].status = 'active';
    if (cells[idx2]) cells[idx2].status = 'active';

    for (let i = changes.length - 1; i >= 0; i--) {
        const change = changes[i];
        if (!change) continue;

        const cell = cells[change.index];
        if (cell) {
            cell[change.field] = change.oldValue;
        }
    }
};

interface Move {
    idx1: number;
    idx2: number;
    score: number;
}

const findAllMoves = (cells: Cell[], limit: number = -1): Move[] => {
    const moves: Move[] = [];
    const len = cells.length;
    const iterLimit = len > 4000 ? GAME_CONFIG.BOT_SEARCH_LIMIT : len;

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
    const candidates = findAllMoves(cells, 8);

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
            currentTotal += (nextResult.score * 0.6);
            undoMove(cells, move.idx1, move.idx2, changes);
        }

        if (currentTotal > bestTotalScore) {
            bestTotalScore = currentTotal;
            bestMove = [move.idx1, move.idx2];
        }
    }

    return { score: bestTotalScore, move: bestMove };
};

self.onmessage = (e: MessageEvent) => {
    const { type, cells, checkHammer } = e.data;

    if (type === 'find') {
        const result = searchBestMove(cells, 1);

        if (result.move) {
            self.postMessage({ type: 'moveFound', move: result.move });
        } else if (checkHammer) {
            const hammerTarget = findHammerMove(cells);
            self.postMessage({ type: 'moveFound', move: null, hammerTarget });
        } else {
            self.postMessage({ type: 'moveFound', move: null });
        }
    }
};