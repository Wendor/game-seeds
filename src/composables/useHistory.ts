import { ref, toRaw, type Ref } from 'vue';
import type { Cell, HistoryRecord, PowerupType } from '../types';
import { GAME_CONFIG } from '../config';

export function useHistory(cells: Ref<Cell[]>, onRestorePowerup?: (type: PowerupType) => void) {
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

    const recordAdd = (ids: number[]) => {
        history.value.push({ type: 'add', count: ids.length, ids });
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

    const recordShuffle = () => {
        // Сохраняем ВСЕ значения ячеек (snapshot)
        // Это может быть много памяти, но для 1-2 шагов назад нормально.
        // Экономнее сохранять только значения активных ячеек, но проще сохранить map value.
        const snapshot = cells.value.map(c => c.value);
        history.value.push({ type: 'shuffle', snapshot });
        trimHistory();
    };

    const recordPowerupUsage = (type: PowerupType) => {
        // Этот рекорд добавляется СЛЕДОМ за действием (например, после shuffle),
        // чтобы при Undo сначала отменилось действие, а потом вернулся заряд.
        history.value.push({ type: 'powerup_usage', powerup: type });
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
                // ИСПРАВЛЕНИЕ: Удаляем конкретные ID, а не просто хвост
                if (lastAction.ids && lastAction.ids.length > 0) {
                    const idsToRemove = new Set(lastAction.ids);
                    cells.value = cells.value.filter(c => !idsToRemove.has(c.id));
                } else if (lastAction.count > 0 && cells.value.length >= lastAction.count) {
                    // Фоллбек для старых сохранений
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
            case 'shuffle':
                if (lastAction.snapshot.length === cells.value.length) {
                    lastAction.snapshot.forEach((val, i) => {
                        const cell = cells.value[i];
                        if (cell) {
                            cell.value = val;
                        }
                    });
                }
                break;

            case 'powerup_usage':
                if (onRestorePowerup) {
                    onRestorePowerup(lastAction.powerup);
                }
                undo();
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
        hasHistory,
        recordShuffle,
        recordPowerupUsage
    };
}