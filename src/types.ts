export type GameMode = 'classic' | 'random' | 'easy' | 'levels';

export type CellStatus = 'active' | 'selected' | 'crossed';

export interface Cell {
    id: number;
    value: number;
    status: CellStatus;
    prev?: number | null;
    next?: number | null;
    up?: number | null;
    down?: number | null;
    isDeleting?: boolean;
    isNew?: boolean;
}

export interface GameRecord {
    date: number;
    time: number;
    mode: GameMode;
    levelId?: string;
}

export type HistoryRecord =
    | { type: 'match'; changes: { index: number; prevStatus: CellStatus }[] }
    | { type: 'add'; count: number; ids: number[] }
    | { type: 'clean'; removedRows: { index: number; cells: Cell[] }[] }
    | { type: 'shuffle'; snapshot: number[] } // Храним слепок значений до перемешивания
    | { type: 'powerup_usage'; powerup: PowerupType }; // Чтобы вернуть заряд при Undo

export interface SavedGameState {
    cells: Cell[];
    time: number;
    mode: GameMode;
    history: HistoryRecord[];
    nextId: number;
    levelId?: string;
    powerups: PowerupState;
}

export interface LevelConfig {
    id: string;
    name: string;
    pattern: string[];
    thresholds: [number, number];
}

export type PowerupType = 'hammer' | 'shuffle' | 'plus_row';

export interface PowerupState {
    hammer: number;
    shuffle: number;
    plus_row: number;
}