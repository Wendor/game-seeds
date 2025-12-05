export type GameMode = 'classic' | 'random';
export type CellStatus = 'active' | 'selected' | 'crossed';

export interface Cell {
    id: number;
    value: number;
    status: CellStatus;
}

export interface GameRecord {
    date: number;
    time: number;
    mode: GameMode;
}

// === НОВЫЕ ТИПЫ ДЛЯ ИСТОРИИ ===
export type HistoryRecord =
    | { type: 'match'; changes: { index: number; prevStatus: CellStatus }[] }
    | { type: 'add'; count: number }
    | { type: 'clean'; previousState: Cell[] }; // Для очистки все же нужен снапшот (структурное изменение)

export interface SavedGameState {
    cells: Cell[];
    time: number;
    mode: GameMode;
    history: HistoryRecord[]; // Изменили тип с string[] на HistoryRecord[]
    nextId: number;
}