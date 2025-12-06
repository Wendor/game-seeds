import { ref } from 'vue';
import { useI18n } from './useI18n';

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

        // Ищем подсказку, начиная с последнего места или с начала
        let hint = findHint(nextHintStartIndex.value);
        if (!hint && nextHintStartIndex.value > 0) {
            hint = findHint(0);
        }

        if (hint && typeof hint[0] === 'number') {
            const firstIndex = hint[0];
            hintIndices.value = hint;

            // Запоминаем, где остановились, чтобы следующая подсказка была новой
            nextHintStartIndex.value = firstIndex + 1;

            scrollToCell(firstIndex);

            // Авто-скрытие через 2 секунды
            hintTimeout = setTimeout(() => {
                hintIndices.value = [];
            }, 2000);
        } else {
            showToast(t('game.noMoves'));
            nextHintStartIndex.value = 0;
        }
    };

    // Сброс индекса поиска (например, при перемешивании или новом ходе)
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