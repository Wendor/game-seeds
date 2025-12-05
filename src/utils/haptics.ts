// src/utils/haptics.ts

// Проверяем поддержку
const canVibrate = typeof navigator !== 'undefined' && !!navigator.vibrate;

export const haptic = {
    // Легкий клик (выбор)
    soft: () => {
        if (canVibrate) navigator.vibrate(10);
    },

    // Средний (ошибка или отмена)
    medium: () => {
        if (canVibrate) navigator.vibrate(40);
    },

    // Успех (двойная вибрация)
    success: () => {
        if (canVibrate) navigator.vibrate([30, 30, 30]);
    },

    // Тяжелый (добавление строк)
    impact: () => {
        if (canVibrate) navigator.vibrate(70);
    }
};