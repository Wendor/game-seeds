// Простой менеджер звуков
const sounds: Record<string, HTMLAudioElement> = {};
let isMuted = false;

// Список звуков (файлы должны лежать в папке public/sounds/)
// Вы можете найти любые mp3 в интернете, например на freesound.org
// Назовите их: pop.mp3, success.mp3, win.mp3, error.mp3, click.mp3
const soundFiles = {
    select: './sounds/pop.mp3',      // Клик по ячейке
    match: './sounds/success.mp3',   // Успешная пара
    error: './sounds/error.mp3',     // Не совпало
    add: './sounds/click.mp3',       // Добавление строк
    win: './sounds/win.mp3',         // Победа
    undo: './sounds/pop.mp3',        // Отмена
    restart: './sounds/click.mp3',   // Рестарт
};

// Предзагрузка звуков
export const initSounds = () => {
    // Читаем настройку из localStorage
    const savedMute = localStorage.getItem('seeds-muted');
    isMuted = savedMute === 'true';

    for (const [key, path] of Object.entries(soundFiles)) {
        const audio = new Audio(path);
        audio.volume = 0.7; // Громкость 50%
        sounds[key] = audio;
    }
};

export const playSound = (name: keyof typeof soundFiles) => {
    if (isMuted || !sounds[name]) return;

    // Сбрасываем время, чтобы можно было играть быстро подряд
    sounds[name].currentTime = 0;
    sounds[name].play().catch(() => {
        // Игнорируем ошибки автовоспроизведения (если юзер еще не кликнул)
    });
};

export const toggleMute = () => {
    isMuted = !isMuted;
    localStorage.setItem('seeds-muted', String(isMuted));
    return isMuted;
};

export const getMuteState = () => isMuted;