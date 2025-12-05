import { ref, type Ref } from 'vue';
import type { Cell } from '../types';

export function useHistory(cells: Ref<Cell[]>) {
    const history = ref<string[]>([]);

    const saveSnapshot = () => {
        history.value.push(JSON.stringify(cells.value));
        // Ограничиваем историю 50 ходами, чтобы не забивать память
        if (history.value.length > 50) history.value.shift();
    };

    const undo = (): boolean => {
        if (history.value.length === 0) return false;

        const previousState = history.value.pop();
        if (previousState) {
            cells.value = JSON.parse(previousState);
            return true;
        }
        return false;
    };

    const clearHistory = () => {
        history.value = [];
    };

    const hasHistory = () => history.value.length > 0;

    return {
        history,
        saveSnapshot,
        undo,
        clearHistory,
        hasHistory
    };
}