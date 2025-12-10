export type GameMode = 'classic' | 'random' | 'easy';

export type CellStatus = 'active' | 'selected' | 'crossed';

export interface Cell {
    id: number;
    value: number;
    status: CellStatus;
    prev?: number | null; // Сосед слева/сверху (по змейке)
    next?: number | null; // Сосед справа/снизу (по змейке)
    isDeleting?: boolean; // Анимация удаления
    isNew?: boolean;      // Анимация появления
}

export interface GameRecord {
    date: number;
    time: number;
    mode: GameMode;
}

export type HistoryRecord =
    | { type: 'match'; changes: { index: number; prevStatus: CellStatus }[] }
    | { type: 'add'; count: number }
    | { type: 'clean'; previousState: Cell[] };

export interface SavedGameState {
    cells: Cell[];
    time: number;
    mode: GameMode;
    history: HistoryRecord[];
    nextId: number;
}