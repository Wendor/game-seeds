<template>
  <footer class="controls">
    <button 
      @click="$emit('undo')" 
      class="btn btn-secondary btn-icon icon-text" 
      :disabled="!canUndo || isGameOver || isBotActive" 
      :title="t('game.undo')"
    >
      ⤺
    </button>
    
    <button 
      @click="$emit('hint')" 
      class="btn btn-secondary btn-icon icon-text" 
      :disabled="isGameOver || isBotActive" 
      :title="t('game.hint')"
    >
      ⚐
    </button>
    
    <button 
      @click="$emit('add')" 
      :disabled="isGameOver || isBotActive" 
      class="btn btn-primary btn-lg"
    >
      {{ t('game.add') }}
    </button>

    <div class="powerup-wrapper" ref="menuRef">
      <button 
        class="btn btn-icon"
        :class="[
          (showDropdown || activePowerup) ? 'btn-primary' : 'btn-secondary',
          { 'pulse-active': activePowerup === 'hammer' }
        ]"
        :disabled="isGameOver || isBotActive"
        @click="toggleDropdown"
        :title="t('game.powerups.title') || 'Бонусы'"
      >
        <div v-if="totalPowerups > 0" class="total-badge">{{ totalPowerups }}</div>

        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </button>

      <Transition name="fade-up">
        <div v-if="showDropdown" class="dropdown-content">
          <button 
            class="dropdown-item" 
            :class="{ 'item-active': activePowerup === 'hammer', disabled: powerups.hammer === 0 }"
            @click="selectPowerup('hammer')"
          >
            <div class="item-left">
              <div class="item-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.7 13.5 21 7.22a1.92 1.92 0 0 0 0-2.72l-1.5-1.5a1.92 1.92 0 0 0-2.72 0L10.5 9.3"></path>
                  <path d="m3 21 8.9-8.9"></path>
                  <path d="m3 21 6.1-6.1"></path>
                </svg>
              </div>
              <span class="item-label">{{ t('game.powerups.hammer') }}</span>
            </div>
            <div class="item-count" v-if="powerups.hammer > 0">{{ powerups.hammer }}</div>
          </button>

          <button 
            class="dropdown-item" 
            :class="{ disabled: powerups.shuffle === 0 }"
            @click="selectPowerup('shuffle')"
          >
            <div class="item-left">
              <div class="item-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="16 3 21 3 21 8"></polyline>
                  <line x1="4" y1="20" x2="21" y2="3"></line>
                  <polyline points="21 16 21 21 16 21"></polyline>
                  <line x1="15" y1="15" x2="21" y2="21"></line>
                  <line x1="4" y1="4" x2="9" y2="9"></line>
                </svg>
              </div>
              <span class="item-label">{{ t('game.powerups.shuffle') }}</span>
            </div>
            <div class="item-count" v-if="powerups.shuffle > 0">{{ powerups.shuffle }}</div>
          </button>

          <button 
            class="dropdown-item" 
            :class="{ disabled: powerups.plus_row === 0 }"
            @click="selectPowerup('plus_row')"
          >
            <div class="item-left">
              <div class="item-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </div>
              <span class="item-label">{{ t('game.powerups.plus_row') }}</span>
            </div>
            <div class="item-count" v-if="powerups.plus_row > 0">{{ powerups.plus_row }}</div>
          </button>
        </div>
      </Transition>
    </div>
    
    <button 
      v-if="isDebug"
      @click="$emit('toggle-bot')" 
      class="btn btn-icon" 
      :class="isBotActive ? 'btn-danger' : 'btn-secondary'" 
      :disabled="isGameOver" 
      :title="t('game.auto')"
    >
      <svg v-if="isBotActive" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>
    </button>
    
    <button 
      @click="$emit('restart')" 
      class="btn btn-secondary btn-icon" 
      :title="t('game.restart')"
    >
      <span class="icon-text">↺</span>
    </button>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from '../composables/useI18n';
import type { PowerupType, PowerupState } from '../types';

const emit = defineEmits(['undo', 'hint', 'add', 'toggle-bot', 'restart', 'use-powerup']);

const { t } = useI18n();

const props = defineProps<{
  canUndo: boolean;
  isGameOver: boolean;
  isBotActive: boolean;
  powerups: PowerupState;
  activePowerup: PowerupType | null;
  isDebug: boolean;
}>();

const totalPowerups = computed(() => {
  return props.powerups.hammer + props.powerups.shuffle + props.powerups.plus_row;
});

const showDropdown = ref(false);
const menuRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const selectPowerup = (type: PowerupType) => {
  emit('use-powerup', type);
  showDropdown.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    showDropdown.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<style scoped>
.controls {
  position: relative;
  flex: 0 0 auto;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 12px 16px 20px 16px;
  background: var(--header-bg);
  border-top: 1px solid var(--border-color);
  z-index: 50;
  display: flex;
  justify-content: center;
  gap: 12px;
  box-sizing: border-box;
}

.icon-text {
  font-size: 1.6rem;
  line-height: 1;
  padding-bottom: 2px;
  display: inline-block;
}

.powerup-wrapper {
  position: relative;
  display: inline-flex;
}

.pulse-active {
  animation: pulse-blue 1.5s infinite;
  z-index: 61;
}

@keyframes pulse-blue {
  0% { box-shadow: 0 0 0 0 rgba(var(--rgb-blue), 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(var(--rgb-blue), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--rgb-blue), 0); }
}

.total-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: rgb(var(--rgb-red));
  color: rgb(var(--rgb-white));
  font-size: 0.7rem;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--header-bg);
  z-index: 10;
  padding: 0 3px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.dropdown-content {
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  min-width: 240px;
  z-index: 60;
}

.dropdown-item {
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  color: var(--text-main);
  transition: background 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
}

.dropdown-item:hover:not(.disabled) {
  background-color: var(--btn-sec-hover);
}

.dropdown-item.item-active {
  background-color: rgba(var(--rgb-blue), 0.1);
  color: rgb(var(--rgb-blue));
}

.dropdown-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

.item-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.item-label {
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
}

.item-icon {
  display: flex;
  align-items: center;
  color: inherit;
}

.item-count {
  background-color: rgb(var(--rgb-red));
  color: rgb(var(--rgb-white));
  font-size: 0.9rem;
  font-weight: 800;
  min-width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  flex-shrink: 0;
}

.item-active .item-count {
  background-color: rgb(var(--rgb-blue));
  color: rgb(var(--rgb-white));
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

@media (min-width: 768px) {
  .controls {
    padding-bottom: 12px;
  }
}
</style>