import { ref } from 'vue';

const isDebug = ref(false);

export function useDebug() {
    const initDebug = () => {
        const saved = localStorage.getItem('seeds-debug');
        isDebug.value = saved === 'true';
    };

    const enableDebug = () => {
        if (!isDebug.value) {
            isDebug.value = true;
            localStorage.setItem('seeds-debug', 'true');
            return true;
        }
        return false;
    };

    return { isDebug, initDebug, enableDebug };
}