// src/composables/useBot.ts
import { ref, type Ref, onUnmounted } from 'vue';
import type { Cell } from '../types';
import { useI18n } from './useI18n';
import BotWorker from '../workers/bot.worker?worker';

interface BotDependencies {
    cells: Ref<Cell[]>;
    gameActions: {
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
    const { t } = useI18n();

    const isBotActive = ref(false);
    let worker: Worker | null = null;
    let botLoopTimeout: number | null = null;

    const initWorker = () => {
        if (!worker) {
            worker = new BotWorker();
            worker.onmessage = handleWorkerMessage;
        }
        return worker; // Возвращаем инстанс
    };

    const terminateWorker = () => {
        if (worker) {
            worker.terminate();
            worker = null;
        }
    };

    const stopBot = () => {
        isBotActive.value = false;
        if (botLoopTimeout) {
            clearTimeout(botLoopTimeout);
            botLoopTimeout = null;
        }
    };

    const requestMove = () => {
        if (!isBotActive.value || gameState.isGameOver.value) {
            stopBot();
            return;
        }

        const plainCells = JSON.parse(JSON.stringify(cells.value));

        // Гарантируем инициализацию перед отправкой
        const activeWorker = initWorker();
        activeWorker.postMessage({ type: 'find', cells: plainCells });
    };

    const handleWorkerMessage = async (e: MessageEvent) => {
        // ... (код обработчика без изменений, он был корректен)
        const { type, move } = e.data;

        if (type === 'moveFound') {
            if (!isBotActive.value) return;

            if (move) {
                const [idx1, idx2] = move;
                uiActions.scrollToCell(idx1);

                await new Promise(r => setTimeout(r, 100));
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

                botLoopTimeout = setTimeout(requestMove, 10);
            } else {
                if (cells.value.length >= 4500) {
                    uiActions.showToast(t('game.botGiveUp'));
                    stopBot();
                    return;
                }

                await new Promise(r => setTimeout(r, 300));
                if (!isBotActive.value) return;

                const count = gameActions.addLines();
                if (count > 0) historyActions.recordAdd(count);
                uiActions.playSound('add');

                botLoopTimeout = setTimeout(requestMove, 500);
            }
        }
    };

    const toggleBot = () => {
        if (isBotActive.value) {
            stopBot();
        } else {
            isBotActive.value = true;
            // Инициализация при старте
            initWorker();
            requestMove();
        }
    };

    onUnmounted(() => {
        stopBot();
        terminateWorker();
    });

    return {
        isBotActive,
        toggleBot,
        stopBot
    };
}