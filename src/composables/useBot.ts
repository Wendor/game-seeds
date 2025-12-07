import { ref, type Ref } from 'vue';
import type { Cell } from '../types';
import { useI18n } from './useI18n'; // <--- Импортируем i18n

interface BotDependencies {
    // ... интерфейс без изменений ...
    cells: Ref<Cell[]>;
    gameActions: {
        canMatch: (idx1: number, idx2: number) => boolean;
        findNeighbors: (index: number) => number[];
        addLines: () => number;
        cleanEmptyRows: () => number;
        updateLinksAfterCross: (idx1: number, idx2: number) => void;
    };
    historyActions: {
        recordMatch: (indices: number[]) => void;
        recordAdd: (count: number) => void;
        recordClean: () => void;
        popHistory: () => void;
    };
    uiActions: {
        playSound: (name: any) => void;
        showToast: (msg: string) => void;
        scrollToCell: (index: number) => void;
    };
    gameState: {
        isGameOver: Ref<boolean>;
    };
}

export function useBot(deps: BotDependencies) {
    const { cells, gameActions, historyActions, uiActions, gameState } = deps;
    const { t } = useI18n(); // <--- Инициализируем
    const isBotActive = ref(false);
    let botTimer: number | null = null;

    const stopBot = () => {
        isBotActive.value = false;
        if (botTimer) {
            clearTimeout(botTimer);
            botTimer = null;
        }
    };

    const findPrevActive = (index: number): number | null => {
        const cell = cells.value[index];
        if (cell && cell.prev !== undefined && cell.prev !== null) {
            return cell.prev;
        }
        for (let i = index - 1; i >= 0; i--) {
            const c = cells.value[i];
            if (c && c.status !== 'crossed') return i;
        }
        return null;
    };

    const findNextActive = (index: number): number | null => {
        const cell = cells.value[index];
        if (cell && cell.next !== undefined && cell.next !== null) {
            return cell.next;
        }
        for (let i = index + 1; i < cells.value.length; i++) {
            const c = cells.value[i];
            if (c && c.status !== 'crossed') return i;
        }
        return null;
    };

    const checkValuesMatch = (c1: Cell, c2: Cell) => {
        return c1.value === c2.value || c1.value + c2.value === 10;
    };

    const findBestMove = (): [number, number] | null => {
        const len = cells.value.length;
        const searchLimit = len > 3000 ? 2500 : len;
        const allMoves: { idx1: number, idx2: number, score: number }[] = [];

        for (let i = 0; i < searchLimit; i++) {
            const currentCell = cells.value[i];
            if (!currentCell || currentCell.status === 'crossed') continue;
            const neighbors = gameActions.findNeighbors(i);

            for (const nIdx of neighbors) {
                if (nIdx > i && gameActions.canMatch(i, nIdx)) {
                    const neighborCell = cells.value[nIdx];
                    if (!neighborCell) continue;
                    let score = 10;
                    const isVertical = (i % 9) === (nIdx % 9);
                    if (isVertical) score += 50;
                    if (currentCell.value === neighborCell.value) score += 15;
                    if (!isVertical) {
                        const prev = findPrevActive(i);
                        const next = findNextActive(nIdx);
                        if (prev !== null && next !== null) {
                            const cPrev = cells.value[prev];
                            const cNext = cells.value[next];
                            if (cPrev && cNext && checkValuesMatch(cPrev, cNext)) score += 80;
                        }
                    }
                    if (i < 27) score += 5;
                    allMoves.push({ idx1: i, idx2: nIdx, score });
                }
            }
        }

        if (allMoves.length === 0) return null;
        allMoves.sort((a, b) => b.score - a.score);
        const bestMove = allMoves[0];
        if (!bestMove) return null;
        const bestScore = bestMove.score;
        const candidates = allMoves.filter(m => m.score >= bestScore - 20);
        const randomIdx = Math.floor(Math.random() * candidates.length);
        const selected = candidates[randomIdx];
        if (!selected) return null;
        return [selected.idx1, selected.idx2];
    };

    const runBotStep = async () => {
        if (!isBotActive.value || gameState.isGameOver.value) {
            stopBot();
            return;
        }

        const move = findBestMove();

        if (move) {
            const [idx1, idx2] = move;
            uiActions.scrollToCell(idx1);
            await new Promise(r => setTimeout(r, 150));
            if (!isBotActive.value) return;

            historyActions.recordMatch([idx1, idx2]);
            const c1 = cells.value[idx1];
            const c2 = cells.value[idx2];
            if (c1) c1.status = 'crossed';
            if (c2) c2.status = 'crossed';
            gameActions.updateLinksAfterCross(idx1, idx2);
            historyActions.recordClean();
            const removed = gameActions.cleanEmptyRows();
            if (removed === 0) historyActions.popHistory();

            botTimer = setTimeout(runBotStep, 50);
        } else {
            if (cells.value.length >= 4500) {
                uiActions.showToast(t('game.botGiveUp')); // <--- ИСПОЛЬЗУЕМ t()
                stopBot();
                return;
            }

            await new Promise(r => setTimeout(r, 600));
            if (!isBotActive.value) return;

            const count = gameActions.addLines();
            if (count > 0) historyActions.recordAdd(count);
            uiActions.playSound('add');

            botTimer = setTimeout(runBotStep, 800);
        }
    };

    const toggleBot = () => {
        if (isBotActive.value) {
            stopBot();
        } else {
            isBotActive.value = true;
            runBotStep();
        }
    };

    return {
        isBotActive,
        toggleBot,
        stopBot
    };
}