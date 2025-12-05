import { ref, type Ref } from 'vue';
import type { Cell } from '../types';

interface BotDependencies {
    cells: Ref<Cell[]>;
    gameActions: {
        canMatch: (idx1: number, idx2: number) => boolean;
        findNeighbors: (index: number) => number[];
        addLines: () => number;
        cleanEmptyRows: () => number;
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
    const isBotActive = ref(false);
    let botTimer: number | null = null;

    const stopBot = () => {
        isBotActive.value = false;
        if (botTimer) {
            clearTimeout(botTimer);
            botTimer = null;
        }
    };

    // --- Вспомогательные функции ---

    const findPrevActive = (index: number): number | null => {
        for (let i = index - 1; i >= 0; i--) {
            const cell = cells.value[i];
            if (cell && cell.status !== 'crossed') return i;
        }
        return null;
    };

    const findNextActive = (index: number): number | null => {
        for (let i = index + 1; i < cells.value.length; i++) {
            const cell = cells.value[i];
            if (cell && cell.status !== 'crossed') return i;
        }
        return null;
    };

    const checkValuesMatch = (c1: Cell, c2: Cell) => {
        return c1.value === c2.value || c1.value + c2.value === 10;
    };

    // --- ЛОГИКА ПОИСКА ---

    const findBestMove = (): [number, number] | null => {
        const len = cells.value.length;
        const searchLimit = len > 3000 ? 2000 : len;

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

                    // 1. Вертикаль
                    const isVertical = (i % 9) === (nIdx % 9);
                    if (isVertical) {
                        score += 50;
                    }

                    // 2. Идентичные числа
                    if (currentCell.value === neighborCell.value) {
                        score += 15;
                    }

                    // 3. Цепная реакция (горизонт)
                    if (!isVertical) {
                        const prev = findPrevActive(i);
                        const next = findNextActive(nIdx);
                        if (prev !== null && next !== null) {
                            const cPrev = cells.value[prev];
                            const cNext = cells.value[next];
                            if (cPrev && cNext && checkValuesMatch(cPrev, cNext)) {
                                score += 80;
                            }
                        }
                    }

                    // 4. Очистка верха
                    if (i < 27) {
                        score += 5;
                    }

                    allMoves.push({ idx1: i, idx2: nIdx, score });
                }
            }
        }

        if (allMoves.length === 0) return null;

        // --- ВЕРОЯТНОСТНЫЙ ВЫБОР ---
        allMoves.sort((a, b) => b.score - a.score);

        // ИСПРАВЛЕНИЕ: Безопасное получение лучшего элемента
        const bestMove = allMoves[0];
        if (!bestMove) return null;

        const bestScore = bestMove.score;
        const candidates = allMoves.filter(m => m.score >= bestScore - 20);

        const randomIdx = Math.floor(Math.random() * candidates.length);
        const selected = candidates[randomIdx];

        // Защита от undefined при доступе по индексу
        if (!selected) return null;

        return [selected.idx1, selected.idx2];
    };

    // --- Игровой цикл ---

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

            historyActions.recordClean();
            const removed = gameActions.cleanEmptyRows();
            if (removed === 0) historyActions.popHistory();

            botTimer = setTimeout(runBotStep, 50);
        } else {
            if (cells.value.length >= 4500) {
                uiActions.showToast('Бот: Слишком много цифр, я сдаюсь.');
                stopBot();
                return;
            }

            //uiActions.showToast('Бот: Ходов нет, добавляю...');
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