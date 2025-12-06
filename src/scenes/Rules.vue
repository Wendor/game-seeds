<template>
  <section class="screen-rules">
    <div class="rules-content">
      <h2>{{ t('rules.title') }}</h2>
      <div class="rules-text">
        <p><strong>{{ t('rules.goal') }}</strong></p>
        <p>{{ t('rules.p1') }}</p>
        <ul>
          <li>{{ t('rules.li1') }}</li>
          <li>{{ t('rules.li2') }}</li>
        </ul>
        <p>{{ t('rules.p2') }}</p>
        <p>{{ t('rules.p3') }}</p>
      </div>
      <button @click="$emit('close')" class="btn btn-primary btn-lg full-width">
        {{ t('rules.btn') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from '../composables/useI18n';
const { t } = useI18n();
defineEmits(['close']);
</script>

<style scoped>
.screen-rules { 
  flex: 1; display: flex; justify-content: center; padding: 40px 20px; 
  background: var(--bg-main); 
}
.rules-content { 
  max-width: 600px; width: 100%; 
  background: var(--card-bg); 
  color: var(--text-main);
  padding: 40px; border-radius: 24px;
  box-shadow: 0 10px 30px -5px var(--shadow-color);
}

.rules-content h2 { font-size: 2rem; margin-bottom: 24px; color: var(--text-main); }
.rules-text { font-size: 1.1rem; line-height: 1.6; color: var(--text-muted); margin-bottom: 30px; }
.rules-text ul { padding-left: 20px; margin: 10px 0; }
.rules-text li { margin-bottom: 8px; }
.full-width { width: 100%; }

@media (max-width: 768px) {
  .rules-content {
    background: transparent;
    padding: 0;
    box-shadow: none;
  }
}
</style>