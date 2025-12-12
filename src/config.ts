export const GAME_CONFIG = {
    ROW_SIZE: 9,

    // Лимиты
    MAX_CELLS: 40000,
    BOT_SEARCH_LIMIT: 3000,

    // Тайминги UI (мс)
    TOAST_DURATION: 2000,
    HINT_DURATION: 2000,

    // Тайминги анимаций
    ANIMATION: {
        ADD_DELAY: 500,
        CLEAN_DELAY: 300,
        GHOST_CLICK: 150,
        BOT_TURN_DELAY: 100
    },

    BOT_THINK_DELAY: 300,
    BOT_ACTION_DELAY: 10,
    BOT_ADD_LINES_DELAY: 500,

    SCORE: {
        VERTICAL: 120,
        SAME_VALUE: 15,
        CHAIN_REACTION: 40,
        POSITION_PENALTY: 0.005
    }
};