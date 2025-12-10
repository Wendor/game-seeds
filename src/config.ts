export const GAME_CONFIG = {
    // Лимиты
    MAX_CELLS: 40000,
    BOT_SEARCH_LIMIT: 2000,

    // Тайминги (мс)
    TOAST_DURATION: 2000,
    HINT_DURATION: 2000,

    // Скорость бота
    BOT_THINK_DELAY: 250,
    BOT_ACTION_DELAY: 50,
    BOT_ADD_LINES_DELAY: 800,

    // Очки (Score) для алгоритма бота
    SCORE: {
        VERTICAL: 150,
        SAME_VALUE: 20,
        CHAIN_REACTION: 500,
        POSITION_PENALTY: 0.001
    }
};