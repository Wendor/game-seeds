import { ref } from 'vue';
import { useI18n } from './useI18n';
import { GAME_CONFIG } from '../config';

interface HintsDeps {
    findHint: (startIndex?: number) => number[] | null;
    scrollToCell: (index: number) => void;
    showToast: (msg: string) => void;
}

export function useGameHints(deps: HintsDeps) {
    const { findHint, scrollToCell, showToast } = deps;
    const { t } = useI18n();

    const hintIndices = ref<number[]>([]);
    const nextHintStartIndex = ref(0);
    let hintTimeout: number | null = null;

    const clearHintUI = () => {
        hintIndices.value = [];
        if (hintTimeout) {
            clearTimeout(hintTimeout);
            hintTimeout = null;
        }
    };

    const showNextHint = () => {
        clearHintUI();

        let hint = findHint(nextHintStartIndex.value);
        if (!hint && nextHintStartIndex.value > 0) {
            hint = findHint(0);
        }

        if (hint && typeof hint[0] === 'number') {
            const firstIndex = hint[0];
            hintIndices.value = hint;
            nextHintStartIndex.value = firstIndex + 1;
            scrollToCell(firstIndex);

            hintTimeout = setTimeout(() => {
                hintIndices.value = [];
            }, GAME_CONFIG.HINT_DURATION);
        } else {
            showToast(t('game.noMoves'));
            nextHintStartIndex.value = 0;
        }
    };

    const resetHintIndex = () => {
        nextHintStartIndex.value = 0;
    };

    return {
        hintIndices,
        showNextHint,
        clearHintUI,
        resetHintIndex
    };
}