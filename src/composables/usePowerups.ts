import { ref } from 'vue';
import { GAME_CONFIG } from '../config';
import type { PowerupType, PowerupState } from '../types';

export function usePowerups() {
    const powerups = ref<PowerupState>({
        amount: GAME_CONFIG.POWERUPS_COUNT
    });

    const activePowerup = ref<PowerupType | null>(null);

    // Списываем из общего пула
    const usePowerup = (type: PowerupType): boolean => {
        if (powerups.value.amount > 0) {
            powerups.value.amount--;
            return true;
        }
        return false;
    };

    // Возвращаем в общий пул
    const restorePowerup = (type: PowerupType) => {
        powerups.value.amount++;
    };

    const toggleActive = (type: PowerupType) => {
        if (activePowerup.value === type) {
            activePowerup.value = null;
        } else {
            // Проверяем общий баланс
            if (powerups.value.amount > 0) {
                activePowerup.value = type;
            }
        }
    };

    const resetPowerups = () => {
        powerups.value = { amount: 3 };
        activePowerup.value = null;
    };

    const initPowerups = (savedState: any) => {
        if (savedState) {
            // Если это новый формат
            if (typeof savedState.amount === 'number') {
                powerups.value.amount = savedState.amount;
            }
            // МИГРАЦИЯ: Если это старый формат (с отдельными полями), суммируем их
            else if ('hammer' in savedState) {
                const total = (savedState.hammer || 0) + (savedState.shuffle || 0) + (savedState.plus_row || 0);
                powerups.value.amount = total;
            }
            else {
                powerups.value.amount = GAME_CONFIG.POWERUPS_COUNT;
            }
        } else {
            powerups.value.amount = GAME_CONFIG.POWERUPS_COUNT;
        }
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