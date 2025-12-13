import { GAME_CONFIG } from '../config';
import type { Cell } from '../types';

const ROW_SIZE = GAME_CONFIG.ROW_SIZE;

/**
 * Проверяет, являются ли ячейки горизонтальными соседями, используя ссылки prev/next.
 * Ссылки prev/next должны быть актуальными.
 */
export const isHorizontalNeighbor = (cells: Cell[], idx1: number, idx2: number): boolean => {
    const c1 = cells[idx1];
    if (!c1) return false;
    return c1.next === idx2 || c1.prev === idx2;
};

/**
 * Проверяет, являются ли ячейки вертикальными соседями путем сканирования столбца.
 * Этот метод надежнее для воркера, где ссылки up/down могут быть неактуальны при симуляции.
 */
export const isVerticalNeighbor = (cells: Cell[], idx1: number, idx2: number): boolean => {
    const col1 = idx1 % ROW_SIZE;
    const col2 = idx2 % ROW_SIZE;
    if (col1 !== col2) return false;

    const start = Math.min(idx1, idx2);
    const end = Math.max(idx1, idx2);

    // Проверяем, есть ли между ними активные (не зачеркнутые) ячейки
    for (let i = start + ROW_SIZE; i < end; i += ROW_SIZE) {
        const cell = cells[i];
        if (cell && cell.status !== 'crossed') return false;
    }
    return true;
};

/**
 * Основная проверка: можно ли соединить две ячейки.
 */
export const canMatch = (cells: Cell[], idx1: number, idx2: number): boolean => {
    const c1 = cells[idx1];
    const c2 = cells[idx2];

    if (!c1 || !c2) return false;
    if (c1.status === 'crossed' || c2.status === 'crossed') return false;
    if (c1.value !== c2.value && c1.value + c2.value !== 10) return false;

    return isHorizontalNeighbor(cells, idx1, idx2) || isVerticalNeighbor(cells, idx1, idx2);
};

/**
 * Находит всех доступных соседей для ячейки (для подсветки или поиска хода).
 */
export const findNeighbors = (cells: Cell[], index: number): number[] => {
    const neighbors: number[] = [];
    const cell = cells[index];
    if (!cell) return [];

    // Горизонтальные (по ссылкам)
    if (cell.prev !== null && cell.prev !== undefined) neighbors.push(cell.prev);
    if (cell.next !== null && cell.next !== undefined) neighbors.push(cell.next);

    // Вертикальные (сканированием)
    const len = cells.length;

    // Вниз
    for (let i = index + ROW_SIZE; i < len; i += ROW_SIZE) {
        const c = cells[i];
        if (c && c.status !== 'crossed') {
            neighbors.push(i);
            break;
        }
    }
    // Вверх
    for (let i = index - ROW_SIZE; i >= 0; i -= ROW_SIZE) {
        const c = cells[i];
        if (c && c.status !== 'crossed') {
            neighbors.push(i);
            break;
        }
    }

    return neighbors;
};