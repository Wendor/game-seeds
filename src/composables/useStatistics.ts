import type { GameMode, GameRecord } from '../types';

export interface StatsData {
    easy: { started: number };
    classic: { started: number };
    random: { started: number };
    levels: { started: number };
}

// Храним лучший результат (звезды) для каждого уровня: { "heart": 3, "smile": 1 }
export type LevelProgress = Record<string, number>;

const STORAGE_KEY = 'seeds-stats-general';
const STORAGE_KEY_RECORDS = 'seeds-records';
const STORAGE_KEY_LEVELS = 'seeds-levels-progress';

export function useStatistics() {
    // ... getStats, incrementGamesStarted (без изменений) ...
    const getStats = (): StatsData => {
        const defaults: StatsData = {
            easy: { started: 0 },
            classic: { started: 0 },
            random: { started: 0 },
            levels: { started: 0 }
        };
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { return { ...defaults, ...JSON.parse(saved) }; } catch { }
        }
        return defaults;
    };

    const incrementGamesStarted = (mode: GameMode) => {
        const stats = getStats();
        if (!stats[mode]) stats[mode] = { started: 0 };
        stats[mode].started += 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    };

    const saveGameRecord = (mode: GameMode, time: number, levelId?: string) => {
        const record: GameRecord = { date: Date.now(), time, mode, levelId };
        try {
            const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
            const records: GameRecord[] = saved ? JSON.parse(saved) : [];
            records.push(record);
            localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
        } catch (e) { console.error(e); }
    };

    const getAllRecords = (): GameRecord[] => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    };

    // --- НОВОЕ: Прогресс уровней ---

    const getLevelStars = (levelId: string): number => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_LEVELS);
            const progress: LevelProgress = saved ? JSON.parse(saved) : {};
            return progress[levelId] || 0;
        } catch { return 0; }
    };

    const saveLevelStars = (levelId: string, stars: number) => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_LEVELS);
            const progress: LevelProgress = saved ? JSON.parse(saved) : {};
            // Сохраняем только лучший результат
            if ((progress[levelId] || 0) < stars) {
                progress[levelId] = stars;
                localStorage.setItem(STORAGE_KEY_LEVELS, JSON.stringify(progress));
            }
        } catch (e) { console.error(e); }
    };

    return {
        getStats,
        incrementGamesStarted,
        saveGameRecord,
        getAllRecords,
        getLevelStars,
        saveLevelStars
    };
}