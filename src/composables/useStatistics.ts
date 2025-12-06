import type { GameMode } from '../types';

interface StatsData {
    easy: { started: number };
    classic: { started: number };
    random: { started: number };
}

const STORAGE_KEY = 'seeds-stats-general';

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

    return {
        getStats,
        incrementGamesStarted
    };
}