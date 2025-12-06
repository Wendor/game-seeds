// src/utils/audio.ts

// Типы для TypeScript, чтобы не ругался на window.webkitAudioContext
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

// Создаем контекст один раз
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const context = new AudioContextClass();

// Хранилище аудио-буферов (сами данные звука)
const buffers: Record<string, AudioBuffer> = {};

let isMuted = false;

const soundFiles = {
    select: './sounds/pop.mp3',
    match: './sounds/success.mp3',
    error: './sounds/error.mp3',
    add: './sounds/click.mp3',
    win: './sounds/win.mp3',
    undo: './sounds/pop.mp3',
    restart: './sounds/click.mp3',
};

// Функция загрузки одного файла
const loadSound = async (key: string, url: string) => {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        // Декодируем mp3 в сырой PCM формат
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        buffers[key] = audioBuffer;
    } catch (e) {
        console.error(`Ошибка загрузки звука ${key}:`, e);
    }
};

export const initSounds = () => {
    // Читаем настройку
    const savedMute = localStorage.getItem('seeds-muted');
    isMuted = savedMute === 'true';

    // Загружаем все звуки параллельно
    Object.entries(soundFiles).forEach(([key, url]) => {
        loadSound(key, url);
    });
};

export const playSound = (name: keyof typeof soundFiles) => {
    if (isMuted || !buffers[name]) return;

    // Браузеры могут приостановить контекст, если не было взаимодействия.
    // Возобновляем его при попытке воспроизведения (обычно это клик пользователя).
    if (context.state === 'suspended') {
        context.resume();
    }

    // Создаем источник звука (одноразовый)
    const source = context.createBufferSource();
    source.buffer = buffers[name];

    // Создаем узел громкости (GainNode)
    const gainNode = context.createGain();
    gainNode.gain.value = 0.5; // Настраиваем громкость (как было 0.7 в оригинале, можно подправить)

    // Цепочка: Источник -> Громкость -> Выход
    source.connect(gainNode);
    gainNode.connect(context.destination);

    // Играем
    source.start(0);
};

export const toggleMute = () => {
    isMuted = !isMuted;
    localStorage.setItem('seeds-muted', String(isMuted));
    return isMuted;
};

export const getMuteState = () => isMuted;