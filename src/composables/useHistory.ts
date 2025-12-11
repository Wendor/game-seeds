import { ref, toRaw, type Ref } from 'vue';
import type { Cell, HistoryRecord } from '../types';
import { GAME_CONFIG } from '../config';

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
        const rowSize = GAME_CONFIG.ROW_SIZE;
        const removedRows: { index: number; cells: Cell[] }[] = [];

        const rawCells = toRaw(cells.value);

        for (let i = 0; i < rawCells.length; i += rowSize) {
            const chunk = rawCells.slice(i, i + rowSize);

            if (chunk.length === rowSize && chunk.every(c => c.status === 'crossed')) {
                const minifiedChunk = chunk.map(c => ({
                    id: c.id,
                    value: c.value,
                    status: c.status
                }));

                removedRows.push({
                    index: i,
                    cells: minifiedChunk as Cell[]
                });
            }
        }

        history.value.push({ type: 'clean', removedRows });
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
                if (lastAction.removedRows && lastAction.removedRows.length > 0) {
                    lastAction.removedRows.sort((a, b) => a.index - b.index);

                    lastAction.removedRows.forEach(row => {
                        row.cells.forEach(c => {
                            delete c.isDeleting;
                            delete c.isNew;
                        });

                        cells.value.splice(row.index, 0, ...row.cells);
                    });
                }
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