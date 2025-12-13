import { toRaw, watch, type Ref } from 'vue';
import type { Cell, GameMode, SavedGameState, HistoryRecord, PowerupState } from '../types';

interface PersistenceDeps {
    cells: Ref<Cell[]>;
    secondsElapsed: Ref<number>;
    history: Ref<HistoryRecord[]>;
    nextId: Ref<number>;
}

export function usePersistence(storageKey: string, deps: PersistenceDeps) {
    const { cells, secondsElapsed, history, nextId } = deps;

    // Добавляем аргумент levelId
    const save = (mode: GameMode, powerups: PowerupState, levelId?: string) => {
        const minifiedCells = cells.value.map(c => ({
            id: c.id,
            value: c.value,
            status: c.status
        }));

        const state: SavedGameState = {
            cells: minifiedCells as Cell[],
            time: secondsElapsed.value,
            mode: mode,
            history: history.value,
            nextId: nextId.value,
            levelId: levelId,
            powerups: toRaw(powerups)
        };

        try {
            localStorage.setItem(storageKey, JSON.stringify(state));
        } catch (e) {
            console.error('Ошибка сохранения игры:', e);
        }
    };

    const load = (): SavedGameState | null => {
        const saved = localStorage.getItem(storageKey);
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Ошибка загрузки сохранения:', e);
            return null;
        }
    };

    const clear = () => {
        localStorage.removeItem(storageKey);
    };

    const hasSave = () => !!localStorage.getItem(storageKey);

    return { save, load, clear, hasSave };
}