// src/composables/usePowerups.ts
import { ref } from 'vue';
import type { PowerupType, PowerupState } from '../types';

export function usePowerups() {
    const powerups = ref<PowerupState>({
        hammer: 2,
        shuffle: 2,
        plus_row: 2
    });

    const activePowerup = ref<PowerupType | null>(null);

    const usePowerup = (type: PowerupType): boolean => {
        if (powerups.value[type] > 0) {
            powerups.value[type]--;
            return true;
        }
        return false;
    };

    const restorePowerup = (type: PowerupType) => {
        powerups.value[type]++;
    };

    const toggleActive = (type: PowerupType) => {
        if (activePowerup.value === type) {
            activePowerup.value = null;
        } else {
            if (powerups.value[type] > 0) {
                activePowerup.value = type;
            }
        }
    };

    const resetPowerups = () => {
        powerups.value = { hammer: 2, shuffle: 2, plus_row: 2 };
        activePowerup.value = null;
    };

    const initPowerups = (savedState: PowerupState) => {
        powerups.value = { ...savedState };
    };

    return {
        powerups,
        activePowerup,
        usePowerup,
        restorePowerup,
        toggleActive,
        resetPowerups,
        initPowerups
    };
}