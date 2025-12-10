import { ref, type Ref } from 'vue';
import type { Cell, HistoryRecord } from '../types';

export function useHistory(cells: Ref<Cell[]>) {
    const history = ref<HistoryRecord[]>([]);

    const recordMatch = (indices: number[]) => {
        const changes = indices.map(i => {
            const cell = cells.value[i];
            return {
                index: i,
                prevStatus: cell ? cell.status : 'active'
            };
        });
        history.value.push({ type: 'match', changes });
        trimHistory();
    };

    const recordAdd = (count: number) => {
        history.value.push({ type: 'add', count });
        trimHistory();
    };

    const recordClean = () => {
        const snapshot = JSON.parse(JSON.stringify(cells.value));
        history.value.push({ type: 'clean', previousState: snapshot });
        trimHistory();
    };

    const undo = (): boolean => {
        const lastAction = history.value.pop();
        if (!lastAction) return false;

        switch (lastAction.type) {
            case 'match':
                lastAction.changes.forEach(({ index, prevStatus }) => {
                    if (cells.value[index]) {
                        cells.value[index].status = prevStatus === 'selected' ? 'active' : prevStatus;
                        // На всякий случай чистим флаги и здесь
                        delete cells.value[index].isDeleting;
                        delete cells.value[index].isNew;
                    }
                });
                break;

            case 'add':
                if (lastAction.count > 0 && cells.value.length >= lastAction.count) {
                    cells.value.splice(cells.value.length - lastAction.count, lastAction.count);
                }
                break;

            case 'clean':
                // Восстанавливаем состояние из снимка
                cells.value = lastAction.previousState;

                // === FIX: Очищаем флаги анимации, попавшие в снимок ===
                cells.value.forEach(cell => {
                    if (cell.isDeleting) delete cell.isDeleting;
                    if (cell.isNew) delete cell.isNew;
                });
                break;
        }
        return true;
    };

    const trimHistory = () => {
        if (history.value.length > 100) history.value.shift();
    };

    const clearHistory = () => {
        history.value = [];
    };

    const popHistory = () => {
        history.value.pop();
    };

    const hasHistory = () => history.value.length > 0;

    return {
        history,
        recordMatch,
        recordAdd,
        recordClean,
        popHistory,
        undo,
        clearHistory,
        hasHistory
    };
}