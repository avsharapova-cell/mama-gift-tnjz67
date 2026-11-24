/* ============================================================
   НАСТРОЙКИ ПОДАРКА — здесь меняется всё, что не текст сайта.
   Редактировать можно в обычном Блокноте. Сохранить → обновить страницу (F5).
   ============================================================ */
window.GIFT = {

  /* 1) ФОТО. Кладёшь файлы в папку assets/photos/ и называешь РОВНО так:
        mom-1, mom-2, mom-3        — экран «Моя мама» (3 фото)
        album-1 … album-8          — экран «Наши воспоминания» (8 фото)
        song-cover                 — обложка песни в финале
     Расширение любое из: jpg, jpeg, png, webp  (например album-1.jpg).
     Если файла нет — на его месте красивая заглушка. */
  photoDir: 'assets/photos/',
  photoExts: ['jpg', 'jpeg', 'png', 'webp'],

  /* НЕОБЯЗАТЕЛЬНО: если файлы называются по-другому (kazan.jpg, mama.png...), укажи их здесь —
     имя места и файл. Подпись можно задать тут же. Остальное работает по именам выше.
     Пример:
       'album-2': { file: 'assets/photos/kazan.jpg', caption: 'Казань' },
       'mom-1':   { file: 'assets/photos/mama.jpg' }                                              */
  photos: {
  },

  /* true  — пустые места подписаны «Здесь будет фото» (удобно при настройке)
     false — пустые места показывают просто нарисованное сердечко (для показа маме) */
  showPlaceholders: false,

  /* Подписи под фото. ВАЖНО: это только предположения о том, какие фото ты положишь.
     Поменяй подпись на ту, что соответствует реальному фото (или оставь '' — без подписи). */
  captions: {
    'mom-1': 'Мама',
    'mom-2': 'Мы всей семьёй',
    'mom-3': 'Наша семья',
    'album-1': 'Соль-Илецк',
    'album-2': 'Казань',
    'album-3': 'Закат',
    'album-4': 'У моря',
    'album-5': 'На катке',
    'album-6': 'Теплоход',
    'album-7': 'Самый лучший',
    'album-8': 'Праздник',
    'song-cover': ''
  },

  /* 2) ВИДЕО ОТ ДАРИНЫ И ДИАНЫ. Положи файлы в assets/video/ и впиши имена.
        Формат лучше всего mp4 (H.264). Если видео не будет — поставь showSisters: false,
        и экран с сёстрами просто пропустится. */
  showSisters: true,
  videos: {
    darina: 'assets/video/darina.mp4',
    diana:  'assets/video/diana.mp4'
  },

  /* ФОНОВАЯ МУСИКА (без слов) — плеер вверху страницы. Файлы лежат в assets/music/.
     Хочешь свои треки — положи mp3 в эту папку и добавь строку. bgmAutoStart: true — музыка тихо
     включается сама, когда мама нажимает «Открыть» (браузер разрешает, потому что это её клик). */
  bgmAutoStart: true,
  bgm: [
    { file: 'assets/music/akvarel.mp3', title: 'Нежный акварельный этюд' },
    { file: 'assets/music/stranitsy.mp3', title: 'Страницы откровений' },
    { file: 'assets/music/vals.mp3', title: 'Вальс воспоминаний' },
    { file: 'assets/music/zakaty.mp3', title: 'Закаты тихой гавани' },
    { file: 'assets/music/vozrozhdenie.mp3', title: 'Возрождение из пепла' },
    { file: 'assets/music/gorizont.mp3', title: 'За горизонтом событий' },
    { file: 'assets/music/zal.mp3', title: 'Зал ожидания' },
    { file: 'assets/music/melodiya1.mp3', title: 'Мелодия 1' },
    { file: 'assets/music/melodiya2.mp3', title: 'Мелодия 2' },
    { file: 'assets/music/melodiya3.mp3', title: 'Мелодия 3' },
    { file: 'assets/music/Heartwarming.mp3', title: 'Heartwarming' },
    { file: 'assets/music/Reminiscing.mp3',  title: 'Reminiscing' },
    { file: 'assets/music/Memory Lane.mp3',  title: 'Memory Lane' },
    { file: 'assets/music/Wallpaper.mp3',    title: 'Wallpaper' }
  ],

  /* 3) ПЕСНЯ. Положи MP3 из Suno в assets/audio/ под именем song.mp3 (или поменяй имя тут). */
  clip: 'assets/video/clip.mp4',
  audio: 'assets/audio/song.mp3',
  songTitle: 'Песня для тебя, мам',

  /* Слова песни: пусто — кнопка «Слова песни» скрыта (текст из Suno пока не сверен с песней). */
  lyrics: ''
};
