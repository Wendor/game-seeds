declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const context = new AudioContextClass();

const buffers: Record<string, AudioBuffer> = {};

let isMuted = false;

export const soundFiles = {
    select: './sounds/pop.mp3',
    match: './sounds/success.mp3',
    error: './sounds/error.mp3',
    add: './sounds/click.mp3',
    win: './sounds/win.mp3',
    undo: './sounds/pop.mp3',
    restart: './sounds/click.mp3',
    pop: './sounds/pop.mp3',
};

export type SoundName = keyof typeof soundFiles;

const loadSound = async (key: string, url: string) => {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        buffers[key] = audioBuffer;
    } catch (e) {
        console.error(`Ошибка загрузки звука ${key}:`, e);
    }
};

export const initSounds = () => {
    const savedMute = localStorage.getItem('seeds-muted');
    isMuted = savedMute === 'true';

    Object.entries(soundFiles).forEach(([key, url]) => {
        loadSound(key, url);
    });
};

export const playSound = (name: SoundName) => {
    if (isMuted || !buffers[name]) return;

    if (context.state === 'suspended') {
        context.resume();
    }

    const source = context.createBufferSource();
    source.buffer = buffers[name];

    const gainNode = context.createGain();
    gainNode.gain.value = 0.5;

    source.connect(gainNode);
    gainNode.connect(context.destination);

    source.start(0);
};

export const toggleMute = () => {
    isMuted = !isMuted;
    localStorage.setItem('seeds-muted', String(isMuted));
    return isMuted;
};

export const getMuteState = () => isMuted;