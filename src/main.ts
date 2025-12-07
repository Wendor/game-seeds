import { createApp } from 'vue';
import App from './App.vue';
import './assets/variables.css';
import { initSounds } from './utils/audio';

initSounds();

createApp(App).mount('#app');