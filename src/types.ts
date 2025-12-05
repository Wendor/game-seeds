// src/types.ts
export type GameMode = 'classic' | 'random';
export type CellStatus = 'active' | 'selected' | 'crossed';

export interface Cell {
    id: number;
    value: number;
    status: CellStatus;
}