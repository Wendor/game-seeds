import { createApp } from 'vue';
import App from './App.vue';
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import { initSounds } from './utils/audio';

initSounds();

createApp(App).use(autoAnimatePlugin).mount('#app');