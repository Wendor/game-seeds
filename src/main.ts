import { createApp } from 'vue';
import App from './App.vue';
import { initSounds } from './utils/audio';

initSounds();

createApp(App).mount('#app');