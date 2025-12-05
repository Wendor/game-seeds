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

// НОВЫЙ ИНТЕРФЕЙС
export interface SavedGameState {
    cells: Cell[];
    time: number;
    mode: GameMode;
    history: string[]; // Сохраняем и историю для Undo!
    nextId: number;
}