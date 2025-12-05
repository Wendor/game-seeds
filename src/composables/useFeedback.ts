import { ref } from 'vue';
import { playSound } from '../utils/audio'; // Предполагается, что utils/audio существует
import { haptic } from '../utils/haptics'; // Предполагается, что utils/haptics существует
import { GAME_CONFIG } from '../config';

export function useFeedback() {
    const toastMessage = ref<string | null>(null);
    let toastTimer: number | null = null;

    const showToast = (msg: string) => {
        if (toastTimer) clearTimeout(toastTimer);
        toastMessage.value = msg;
        toastTimer = setTimeout(() => {
            toastMessage.value = null;
        }, GAME_CONFIG.TOAST_DURATION);
    };

    return {
        toastMessage,
        showToast,
        playSound, // Проксируем утилиты
        haptic
    };
}