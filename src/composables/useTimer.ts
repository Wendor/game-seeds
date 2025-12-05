import { ref, computed } from 'vue';

export function useTimer() {
    const secondsElapsed = ref(0);
    let timerInterval: number | null = null;

    const formattedTime = computed(() => {
        const m = Math.floor(secondsElapsed.value / 60).toString().padStart(2, '0');
        const s = (secondsElapsed.value % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    });

    const startTimer = () => {
        stopTimer(); // На случай, если уже запущен
        timerInterval = setInterval(() => {
            secondsElapsed.value++;
        }, 1000);
    };

    const stopTimer = () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    };

    const resetTimer = (initialTime = 0) => {
        stopTimer();
        secondsElapsed.value = initialTime;
    };

    return {
        secondsElapsed,
        formattedTime,
        startTimer,
        stopTimer,
        resetTimer
    };
}