export type GameMode = 'classic' | 'random' | 'easy';

export type CellStatus = 'active' | 'selected' | 'crossed';

export interface Cell {
    id: number;
    value: number;
    status: CellStatus;
    prev?: number | null; // Сосед слева/сверху (по змейке)
    next?: number | null; // Сосед справа/снизу (по змейке)
    up?: number | null;   // <--- Сосед физически сверху (по колонке)
    down?: number | null; // <--- Сосед физически снизу (по колонке)
    isDeleting?: boolean;
    isNew?: boolean;
}

export interface GameRecord {
    date: number;
    time: number;
    mode: GameMode;
}

export type HistoryRecord =
    | { type: 'match'; changes: { index: number; prevStatus: CellStatus }[] }
    | { type: 'add'; count: number }
    | { type: 'clean'; removedRows: { index: number; cells: Cell[] }[] };

export interface SavedGameState {
    cells: Cell[];
    time: number;
    mode: GameMode;
    history: HistoryRecord[];
    nextId: number;
}