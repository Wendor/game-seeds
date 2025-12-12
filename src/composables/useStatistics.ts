import type { GameMode, GameRecord } from '../types';

export interface StatsData {
    easy: { started: number };
    classic: { started: number };
    random: { started: number };
}

const STORAGE_KEY = 'seeds-stats-general';
const STORAGE_KEY_RECORDS = 'seeds-records';

export function useStatistics() {
    const getStats = (): StatsData => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                // ignore
            }
        }
        return {
            easy: { started: 0 },
            classic: { started: 0 },
            random: { started: 0 }
        };
    };

    const incrementGamesStarted = (mode: GameMode) => {
        const stats = getStats();
        if (!stats[mode]) stats[mode] = { started: 0 };

        stats[mode].started += 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    };
    const saveGameRecord = (mode: GameMode, time: number) => {
        const record: GameRecord = {
            date: Date.now(),
            time,
            mode
        };

        try {
            const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
            const records: GameRecord[] = saved ? JSON.parse(saved) : [];
            records.push(record);
            localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
        } catch (e) {
            console.error('Failed to save record', e);
        }
    };

    // Добавляем метод для получения всех рекордов (чтобы использовать в Leaderboard)
    const getAllRecords = (): GameRecord[] => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    };

    return {
        getStats,
        incrementGamesStarted,
        saveGameRecord,
        getAllRecords
    };
}