<template>
  <section class="screen-rules">
    <div class="rules-content">
      <h2>Как играть?</h2>
      <div class="rules-text">
        <p><strong>Цель:</strong> Очистить поле от всех цифр.</p>
        <p>Вы можете зачеркнуть пару цифр, если:</p>
        <ul>
          <li>Они <strong>одинаковые</strong> (например, 2 и 2)</li>
          <li>Или дают <strong>в сумме 10</strong> (например, 3 и 7)</li>
        </ul>
        <p>Цифры должны стоять рядом по горизонтали или вертикали. Зачеркнутые цифры можно "перепрыгивать".</p>
        <p>Если ходов нет — жмите кнопку <strong>"Добавить"</strong>.</p>
      </div>
      <button @click="$emit('close')" class="btn btn-primary btn-lg full-width">
        Всё понятно
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineEmits(['close']);
</script>

<style scoped>
.screen-rules { flex: 1; display: flex; justify-content: center; padding: 40px 20px; background: #fff; }
.rules-content { max-width: 600px; width: 100%; }
.rules-content h2 { font-size: 2rem; margin-bottom: 24px; color: #0f172a; }
.rules-text { font-size: 1.1rem; line-height: 1.6; color: #334155; margin-bottom: 30px; }
.rules-text ul { padding-left: 20px; margin: 10px 0; }
.rules-text li { margin-bottom: 8px; }
.full-width { width: 100%; }

@media (min-width: 768px) {
  .rules-content {
    background: white; padding: 40px; border-radius: 24px;
    box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);
  }
}
</style>