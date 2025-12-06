import { ref } from 'vue';

const currentLang = ref<'ru' | 'en'>('ru');

const dictionary = {
    ru: {
        menu: {
            title: 'Семечки',
            subtitle: 'Логическая игра из детства',
            resume: 'Продолжить игру',
            easy: 'Лайт (Легкий)',
            classic: 'Классика (1-19)',
            random: 'Случайные числа',
            install: 'Установить приложение',
            records: 'Рекорды',
            rules: 'Правила игры',
            saveInfo: '{mode} • {time}'
        },
        game: {
            menu: 'меню',
            total: 'всего',
            win: '🎉 Победа! 🎉',
            time: 'Время: {time}',
            share: '📤 Поделиться',
            toMenu: 'В меню',
            undo: 'Отмена',
            hint: 'Подсказка',
            add: '+ цифры',
            auto: 'Автоигра',
            restart: 'Рестарт',
            restartTitle: 'Начать заново?',
            restartMsg: 'Весь текущий прогресс будет потерян.',
            yes: 'Да, начать',
            cancel: 'Отмена',
            fullLines: 'Слишком много цифр! Очистите поле.',
            added: 'Добавлено {n} цифр',
            cleared: 'Ряд очищен!',
            clearedMulti: 'Убрано рядов: {n}',
            noMoves: 'Ходов нет! Жми "Добавить"',
            copied: 'Скопировано!',
            shareText: '🧩 Семечки\n🏆 Победа за {time}!'
        },
        rules: {
            title: 'Как играть?',
            goal: 'Цель: Очистить поле от всех цифр.',
            p1: 'Вы можете зачеркнуть пару цифр, если:',
            li1: 'Они одинаковые (например, 2 и 2)',
            li2: 'Или дают в сумме 10 (например, 3 и 7)',
            p2: 'Цифры должны стоять рядом по горизонтали или вертикали. Зачеркнутые цифры можно "перепрыгивать".',
            p3: 'Если ходов нет — жмите кнопку "Добавить".',
            btn: 'Всё понятно'
        },
        records: {
            title: 'Рекорды',
            easy: 'Лайт',
            classic: 'Классика',
            random: 'Рандом',
            empty: 'Пока нет побед. Сыграем?',
            back: 'Назад в меню'
        }
    },
    en: {
        menu: {
            title: 'Seeds',
            subtitle: 'Classic logic game',
            resume: 'Resume Game',
            easy: 'Lite (Easy)',
            classic: 'Classic (1-19)',
            random: 'Random Numbers',
            install: 'Install App',
            records: 'Leaderboard',
            rules: 'How to play',
            saveInfo: '{mode} • {time}'
        },
        game: {
            menu: 'menu',
            total: 'left',
            win: '🎉 Victory! 🎉',
            time: 'Time: {time}',
            share: '📤 Share',
            toMenu: 'Main Menu',
            undo: 'Undo',
            hint: 'Hint',
            add: '+ cells',
            auto: 'Auto',
            restart: 'Restart',
            restartTitle: 'Restart Game?',
            restartMsg: 'Current progress will be lost.',
            yes: 'Yes, restart',
            cancel: 'Cancel',
            fullLines: 'Too many numbers! Clear some rows.',
            added: 'Added {n} numbers',
            cleared: 'Row cleared!',
            clearedMulti: 'Rows cleared: {n}',
            noMoves: 'No moves! Press "Add Rows"',
            copied: 'Copied!',
            shareText: '🧩 Seeds Game\n🏆 Won in {time}!'
        },
        rules: {
            title: 'How to play?',
            goal: 'Goal: Clear the field of all numbers.',
            p1: 'You can cross out a pair of numbers if:',
            li1: 'They are equal (e.g. 2 and 2)',
            li2: 'They add up to 10 (e.g. 3 and 7)',
            p2: 'Numbers must be adjacent horizontally or vertically. You can "jump" over crossed-out numbers.',
            p3: 'If there are no moves left, press "Add Rows".',
            btn: 'Got it'
        },
        records: {
            title: 'Best Scores',
            easy: 'Lite',
            classic: 'Classic',
            random: 'Random',
            empty: 'No wins yet. Let\'s play?',
            back: 'Back to Menu'
        }
    }
};

export function useI18n() {
    const t = (path: string, params?: Record<string, string | number>) => {
        const keys = path.split('.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let value: any = dictionary[currentLang.value];

        for (const key of keys) {
            if (value && value[key]) {
                value = value[key];
            } else {
                return path;
            }
        }

        if (typeof value === 'string' && params) {
            Object.entries(params).forEach(([k, v]) => {
                value = value.replace(`{${k}}`, String(v));
            });
        }

        return value;
    };

    const initLanguage = () => {
        const saved = localStorage.getItem('seeds-lang');
        if (saved === 'ru' || saved === 'en') {
            currentLang.value = saved;
        } else {
            const systemLang = navigator.language.slice(0, 2);
            currentLang.value = systemLang === 'ru' ? 'ru' : 'en';
        }
    };

    const toggleLanguage = () => {
        currentLang.value = currentLang.value === 'ru' ? 'en' : 'ru';
        localStorage.setItem('seeds-lang', currentLang.value);
    };

    return { t, currentLang, initLanguage, toggleLanguage };
}