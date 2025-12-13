import { ref, type Ref, onUnmounted, toRaw } from 'vue';
import type { Cell, PowerupState, PowerupType } from '../types';
import { useI18n } from './useI18n';
import BotWorker from '../workers/bot.worker?worker';
import type { SoundName } from '../utils/audio';
import { GAME_CONFIG } from '../config';

interface BotDependencies {
    cells: Ref<Cell[]>;
    powerups: Ref<PowerupState>;
    isBotActiveRef?: Ref<boolean>;
    powerupActions: {
        usePowerup: (type: PowerupType) => boolean;
        handlePowerupClick: (type: PowerupType) => void;
        handleUserCellClick: (index: number) => void;
    };
    gameActions: {
        addLines: () => number[] | number;
        cleanEmptyRows: () => number | void;
        updateLinksAfterCross: (idx1: number, idx2: number) => void;
    };
    historyActions: {
        recordMatch: (indices: number[]) => void;
        recordAdd: (ids: number[]) => void;
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
    const { cells, powerups, powerupActions, gameActions, historyActions, uiActions, gameState } = deps;
    const { t } = useI18n();

    const isBotActive = deps.isBotActiveRef || ref(false);

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

        // ИСПРАВЛЕНО: Проверяем общий пул, а не .hammer
        const hasCharges = powerups.value.amount > 0;

        // Если заряды есть, просим воркер поискать цель для молотка
        activeWorker.postMessage({ type: 'find', cells: plainCells, checkHammer: hasCharges });
    };

    const handleWorkerMessage = async (e: MessageEvent) => {
        const { type, move, hammerTarget } = e.data;

        if (type === 'moveFound') {
            if (!isBotActive.value) return;

            if (move) {
                // === ОБЫЧНЫЙ ХОД ===
                const [idx1, idx2] = move;
                uiActions.scrollToCell(idx1);

                await new Promise(r => setTimeout(r, GAME_CONFIG.ANIMATION.BOT_TURN_DELAY));
                if (!isBotActive.value) return;

                historyActions.recordMatch([idx1, idx2]);

                const c1 = cells.value[idx1];
                const c2 = cells.value[idx2];
                if (c1) c1.status = 'crossed';
                if (c2) c2.status = 'crossed';

                gameActions.updateLinksAfterCross(idx1, idx2);
                historyActions.recordClean();

                const removed = gameActions.cleanEmptyRows();
                if (typeof removed !== 'number' || removed <= 0) {
                    historyActions.popHistory();
                }

                botLoopTimeout = setTimeout(requestMove, GAME_CONFIG.BOT_ACTION_DELAY);

            } else {
                // === ХОДОВ НЕТ: ИСПОЛЬЗУЕМ БОНУСЫ ===

                // ИСПРАВЛЕНО: Проверяем powerups.value.amount
                const hasCharges = powerups.value.amount > 0;

                // 1. Молоток (Если есть цель И есть общий заряд)
                if (typeof hammerTarget === 'number' && hasCharges) {
                    uiActions.scrollToCell(hammerTarget);
                    await new Promise(r => setTimeout(r, 100));
                    if (!isBotActive.value) return;

                    powerupActions.handlePowerupClick('hammer');
                    powerupActions.handleUserCellClick(hammerTarget);

                    botLoopTimeout = setTimeout(requestMove, 600);
                    return;
                }

                // 2. Перемешивание (Если есть общий заряд, но молоток не пригодился)
                if (hasCharges) {
                    await new Promise(r => setTimeout(r, 100));
                    if (!isBotActive.value) return;

                    powerupActions.handlePowerupClick('shuffle');

                    botLoopTimeout = setTimeout(requestMove, 800);
                    return;
                }

                // 3. Добавление строк (когда зарядов нет)
                if (cells.value.length >= GAME_CONFIG.MAX_CELLS) {
                    uiActions.showToast(t('game.botGiveUp'));
                    stopBot();
                    return;
                }

                await new Promise(r => setTimeout(r, 100));
                if (!isBotActive.value) return;

                gameActions.addLines();
                botLoopTimeout = setTimeout(requestMove, GAME_CONFIG.BOT_ADD_LINES_DELAY);
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