import { ref, type Ref } from 'vue';
import type { Cell, HistoryRecord } from '../types';

export function useHistory(cells: Ref<Cell[]>) {
    const history = ref<HistoryRecord[]>([]);

    // Запись хода (совпадение пары) - сохраняем только индексы и старый статус
    const recordMatch = (indices: number[]) => {
        const changes = indices.map(i => {
            const cell = cells.value[i];
            return {
                index: i,
                // Исправление ошибки TS2532:
                // Если ячейки вдруг нет (хотя логически она должна быть), 
                // берем дефолтный статус 'active', чтобы не сломать типы
                prevStatus: cell ? cell.status : 'active'
            };
        });
        history.value.push({ type: 'match', changes });
        trimHistory();
    };

    // Запись добавления строк - сохраняем только количество
    const recordAdd = (count: number) => {
        history.value.push({ type: 'add', count });
        trimHistory();
    };

    // Запись очистки строк - сохраняем снапшот, так как массив меняется структурно
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
                // Возвращаем старые статусы ячейкам
                lastAction.changes.forEach(({ index, prevStatus }) => {
                    if (cells.value[index]) {
                        // Если ячейка была выбрана ('selected'), 
                        // при отмене делаем её просто активной ('active'), 
                        // чтобы не возвращать выделение.
                        cells.value[index].status = prevStatus === 'selected' ? 'active' : prevStatus;
                    }
                });
                break;

            case 'add':
                // Отрезаем N добавленных элементов с конца
                if (lastAction.count > 0 && cells.value.length >= lastAction.count) {
                    cells.value.splice(cells.value.length - lastAction.count, lastAction.count);
                }
                break;

            case 'clean':
                // Восстанавливаем массив целиком (тяжелая операция, но редкая)
                cells.value = lastAction.previousState;
                break;
        }
        return true;
    };

    const trimHistory = () => {
        // Можно хранить больше ходов, так как они теперь легкие
        if (history.value.length > 100) history.value.shift();
    };

    const clearHistory = () => {
        history.value = [];
    };

    // Вспомогательная функция, чтобы убрать запись, если действие не состоялось (например, clean удалил 0 строк)
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