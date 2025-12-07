import { ref } from 'vue';
import { playSound } from '../utils/audio';
import { haptic } from '../utils/haptics';
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
        playSound,
        haptic
    };
}