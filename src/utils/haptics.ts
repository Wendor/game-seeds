// src/utils/haptics.ts

// Проверяем поддержку
const canVibrate = typeof navigator !== 'undefined' && !!navigator.vibrate;

export const haptic = {
    soft: () => {
        if (canVibrate) navigator.vibrate(10);
    },

    medium: () => {
        if (canVibrate) navigator.vibrate(40);
    },

    success: () => {
        if (canVibrate) navigator.vibrate([30, 30, 30]);
    },

    impact: () => {
        if (canVibrate) navigator.vibrate(70);
    }
};