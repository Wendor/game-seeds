import { ref, type Ref, onUnmounted, toRaw } from 'vue';
import type { Cell } from '../types';
import { useI18n } from './useI18n';
import BotWorker from '../workers/bot.worker?worker';
import type { SoundName } from '../utils/audio';

interface BotDependencies {
    cells: Ref<Cell[]>;
    gameActions: {
        addLines: () => number;
        cleanEmptyRows: () => number | void; // <--- FIX
        updateLinksAfterCross: (idx1: number, idx2: number) => void;
    };
    historyActions: {
        recordMatch: (indices: number[]) => void;
        recordAdd: (count: number) => void;
        recordClean: () => void;
        popHistory: () => void;
    };
    uiActions: {
        playSound: (name: SoundName) => void;
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
        return worker;
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

        const plainCells = toRaw(cells.value).map(c => toRaw(c));
        const activeWorker = initWorker();
        activeWorker.postMessage({ type: 'find', cells: plainCells });
    };

    const handleWorkerMessage = async (e: MessageEvent) => {
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
                // Так как бот использует анимированную очистку (которая возвращает void),
                // мы просто запускаем её. Если это обычная очистка, она вернет number.
                const removed = gameActions.cleanEmptyRows();

                // Если функция вернула 0 (синхронно ничего не удалила), убираем запись истории.
                // Если вернула void (асинхронно), то она сама разберется с историей.
                if (typeof removed === 'number' && removed === 0) {
                    historyActions.popHistory();
                }

                botLoopTimeout = setTimeout(requestMove, 10);
            } else {
                if (cells.value.length >= 4500) {
                    uiActions.showToast(t('game.botGiveUp'));
                    stopBot();
                    return;
                }

                await new Promise(r => setTimeout(r, 300));
                if (!isBotActive.value) return;

                const count = gameActions.addLines(); // Анимированное добавление
                if (count > 0) historyActions.recordAdd(count);
                // Звук уже есть внутри addLinesWithAnimation

                botLoopTimeout = setTimeout(requestMove, 500);
            }
        }
    };

    const toggleBot = () => {
        if (isBotActive.value) {
            stopBot();
        } else {
            isBotActive.value = true;
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