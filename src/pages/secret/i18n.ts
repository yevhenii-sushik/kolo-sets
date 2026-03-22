// Переводы интерфейса

export type Language = 'en' | 'ru' ;

export interface Translations {
  appName: string;
  loading: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  create: string;
  back: string;
  next: string;
  finish: string;
  close: string;
  
  nav: {
    home: string;
    words: string;
    stories: string;
    dictionary: string;
    profile: string;
    other: string;
  };

  home: {
    title: string;
    myDecks: string;
    noDecks: string;
    noDecksDescription: string;
    createDeck: string;
    addDeck: string;
    totalDecks: string;
  };
  
  createCollection: {
    title: string;
    nameLabel: string;
    namePlaceholder: string;
    languageLabel: string;
    languageDescription: string;
  };
  
  collectionCard: {
    cards: string;
    lastStudied: string;
    neverStudied: string;
    study: string;
    quiz: string;
    edit: string;
    confirmDelete: string;
  };

  flashcards: {
    title: string;
    mode: string;
    shuffle: string;
    card: string;
    of: string;
    flipToSee: string;
    translation: string;
    explanation: string;
    example: string;
    dontKnow: string;
    forgot: string;
    remember: string;
    know: string;
    sessionComplete: string;
    statistics: string;
    totalCards: string;
    duration: string;
    backToCollection: string;
    accuracy: string;
  };

  quiz: {
    title: string;
    mode: string;
    question: string;
    of: string;
    yourAnswer: string;
    correct: string;
    incorrect: string;
    correctAnswer: string;
    checkAnswer: string;
    nextQuestion: string;
    finishQuiz: string;
    settings: string;
    quizComplete: string;
    statistics: string;
    totalQuestions: string;
    correctAnswers: string;
    wrongAnswers: string;
    accuracy: string;
    duration: string;
    mistakes: string;
    restartQuiz: string;
    backToCollection: string;
    enterAnswer: string;
    additionalInfo: string;
    word: string;
    translation: string;
    explanation: string;
    example: string;
  };

  editCollection: {
    title: string;
    addCard: string;
    import: string;
    export: string;
    noCards: string;
    noCardsDescription: string;
    word: string;
    translation: string;
    partOfSpeech: string;
  };

  addCard: {
    title: string;
    wordLabel: string;
    wordPlaceholder: string;
    translationLabel: string;
    translationPlaceholder: string;
    explanationLabel: string;
    explanationPlaceholder: string;
    exampleLabel: string;
    examplePlaceholder: string;
    partOfSpeechLabel: string;
    partOfSpeechPlaceholder: string;
  };
  
  profile: {
    pictureUrl: string,
    editProfile: string;
    logout: string;
    saveChanges: string;
    displayName: string;
    username: string;
    enterImageUrl: string;
    confirmLogout: string;
    
    streak: {
      title: string;
      daysInRow: string;
      record: string;
      days: string;
    };
    
    stats: {
      weekTitle: string;
      sessions: string;
      cardsStudied: string;
      studyTime: string;
      activityTitle: string;
      overallTitle: string;
      totalCards: string;
      flashcardSessions: string;
      quizzesTaken: string;
    };
    
    achievements: {
      title: string;
    };
  };
  
  // Аутентификация
  auth: {
    login: {
      title: string;
      subtitle: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      loginButton: string;
      googleButton: string;
      noAccount: string;
      register: string;
    };
    register: {
      title: string;
      subtitle: string;
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      confirmPasswordLabel: string;
      confirmPasswordPlaceholder: string;
      registerButton: string;
      googleButton: string;
      haveAccount: string;
      login: string;
      passwordsDontMatch: string;
    };
  };

  other: {
    settings: string,
    updates: string,
    privacy: string,
    systemInfo: string,
    dataManagement: string,
    support: string,
    footer: string,
  },

  settings: {
    soundEffects: string;
    soundEffectsDescription: string;
    language: string;
    languageDescription: string;
    theme: string;
    lightMode: string;
    darkMode: string;
  };

  updates: {
    title: string;
    subtitle: string;
    features: {
      efficiency: {
        title: string;
        description: string;
      };
      privacy: {
        title: string;
        description: string;
      };
      simplicity: {
        title: string;
        description: string;
      };
    };
    versionsTitle: string;
    developedBy: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    // Общие
    appName: 'Kolo Sets',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    close: 'Close',
    
    nav: {
      home: 'Home',
      words: 'Words',
      stories: 'Stories',
      dictionary: 'Dictionary',
      profile: 'Profile',
      other: 'Other',
    },

    home: {
      title: 'Home',
      myDecks: 'My decks',
      noDecks: "You don't have any decks yet",
      noDecksDescription: 'Create your first deck to start learning',
      createDeck: 'Create deck',
      addDeck: 'Add deck',
      totalDecks: 'Total decks',
    },

    createCollection: {
      title: 'Create new deck',
      nameLabel: 'Deck name',
      namePlaceholder: 'e.g., Norwegian - Basic words',
      languageLabel: 'Word language (for pronunciation)',
      languageDescription: 'Select the language of words in this deck',
    },

    collectionCard: {
      cards: 'cards',
      lastStudied: 'Last studied',
      neverStudied: 'Never studied',
      study: 'Study',
      quiz: 'Quiz',
      edit: 'Edit',
      confirmDelete: 'Are you sure you want to delete this deck?',
    },

    flashcards: {
      title: 'Flashcards',
      mode: 'Mode: Flashcards',
      shuffle: 'Shuffle',
      card: 'Card',
      of: 'of',
      flipToSee: 'Click to flip',
      translation: 'Translation',
      explanation: 'Explanation',
      example: 'Example',
      dontKnow: "Don't know",
      forgot: 'Forgot',
      remember: 'Remember',
      know: 'Know',
      sessionComplete: 'Session complete!',
      statistics: 'Statistics',
      totalCards: 'Total cards',
      duration: 'Duration',
      backToCollection: 'Back to deck',
      accuracy: 'Accuracy',
    },

    quiz: {
      title: 'Quiz',
      mode: 'Mode: Quiz',
      question: 'Question',
      of: 'of',
      yourAnswer: 'Your answer',
      correct: 'Correct',
      incorrect: 'Incorrect',
      correctAnswer: 'Correct answer',
      checkAnswer: 'Check',
      nextQuestion: 'Next',
      finishQuiz: 'Finish',
      settings: 'Settings',
      quizComplete: 'Quiz complete!',
      statistics: 'Statistics',
      totalQuestions: 'Total questions',
      correctAnswers: 'Correct answers',
      wrongAnswers: 'Wrong answers',
      accuracy: 'Accuracy',
      duration: 'Duration',
      mistakes: 'Mistakes',
      restartQuiz: 'Restart quiz',
      backToCollection: 'Back to deck',
      enterAnswer: 'Enter your answer',
      additionalInfo: 'Additional info',
      word: 'Word',
      translation: 'Translation',
      explanation: 'Explanation',
      example: 'Example',
    },

    editCollection: {
      title: 'Edit deck',
      addCard: 'Add card',
      import: 'Import',
      export: 'Export',
      noCards: 'No cards yet',
      noCardsDescription: 'Add your first card to start learning',
      word: 'Word',
      translation: 'Translation',
      partOfSpeech: 'Part of speech',
    },

    addCard: {
      title: 'Add card',
      wordLabel: 'Word',
      wordPlaceholder: 'Enter word',
      translationLabel: 'Translation',
      translationPlaceholder: 'Enter translation',
      explanationLabel: 'Explanation',
      explanationPlaceholder: 'Enter explanation (optional)',
      exampleLabel: 'Example',
      examplePlaceholder: 'Enter example sentence (optional)',
      partOfSpeechLabel: 'Part of speech',
      partOfSpeechPlaceholder: 'e.g., noun, verb, adjective',
    },

    profile: {
      pictureUrl: 'Enter image URL',
      editProfile: 'Edit',
      logout: 'Logout',
      saveChanges: 'Save changes',
      displayName: 'Display name',
      username: 'Username',
      enterImageUrl: 'Enter image URL',
      confirmLogout: 'Are you sure you want to logout?',
      
      streak: {
        title: 'Streak',
        daysInRow: 'days in row',
        record: 'Record',
        days: 'days',
      },
      
      stats: {
        weekTitle: 'This week',
        sessions: 'Sessions',
        cardsStudied: 'Cards studied',
        studyTime: 'Study time',
        activityTitle: 'Activity',
        overallTitle: 'Overall statistics',
        totalCards: 'Total cards',
        flashcardSessions: 'Flashcard sessions',
        quizzesTaken: 'Quizzes taken',
      },
      
      achievements: {
        title: 'Achievements',
      },
    },
 

    // Аутентификация
    auth: {
      login: {
        title: 'Welcome back',
        subtitle: 'Sign in to continue learning',
        emailLabel: 'Email',
        emailPlaceholder: 'your@email.com',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter password',
        loginButton: 'Sign in',
        googleButton: 'Sign in with Google',
        noAccount: "Don't have an account?",
        register: 'Sign up',
      },
      register: {
        title: 'Create account',
        subtitle: 'Start your learning journey',
        nameLabel: 'Name',
        namePlaceholder: 'Your name',
        emailLabel: 'Email',
        emailPlaceholder: 'your@email.com',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Create password',
        confirmPasswordLabel: 'Confirm password',
        confirmPasswordPlaceholder: 'Confirm password',
        registerButton: 'Sign up',
        googleButton: 'Sign up with Google',
        haveAccount: 'Already have an account?',
        login: 'Sign in',
        passwordsDontMatch: 'Passwords do not match',
      },
    },

    other: {
      settings: 'Settings',
      updates: 'Kolo Updates',
      privacy: 'Security & Privacy',
      systemInfo: 'About System',
      dataManagement: 'Export & Import',
      support: 'Support',
      footer: 'Developed by',
    },

    settings: {
      soundEffects: 'Sound effects',
      soundEffectsDescription: 'Play sounds for correct/incorrect answers',
      language: 'Interface language',
      languageDescription: 'Change interface language',
      theme: 'Theme',
      lightMode: 'Light',
      darkMode: 'Dark',
    },

    updates: {
      title: 'Kolo Sets',
      subtitle: 'Minimalist tool for learning Norwegian built on scientific spaced repetition approach.',
      features: {
        efficiency: {
          title: 'Efficiency',
          description: 'SRS algorithm shows words exactly when you are about to forget them.',
        },
        privacy: {
          title: 'Privacy',
          description: 'All your data is stored locally in the browser. No servers or data collection.',
        },
        simplicity: {
          title: 'Simplicity',
          description: 'Focus on learning, not on settings. Create sets and start learning right away.',
        },
      },
      versionsTitle: 'Version History',
      developedBy: 'Developed by',
    },
  },
  
  ru: {
    appName: 'Kolo Sets',
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    create: 'Создать',
    back: 'Назад',
    next: 'Далее',
    finish: 'Завершить',
    close: 'Закрыть',
    
    nav: {
      home: 'Главная',
      words: 'Слова',
      stories: 'Истории',
      dictionary: 'Словарь',
      profile: 'Профиль',
      other: 'Другое',
    },

    home: {
      title: 'Главная',
      myDecks: 'Мои колоды',
      noDecks: 'У вас пока нет колод',
      noDecksDescription: 'Создайте первую колоду для начала обучения',
      createDeck: 'Создать колоду',
      addDeck: 'Добавить колоду',
      totalDecks: 'Всего колод',
    },

    createCollection: {
      title: 'Создать новую колоду',
      nameLabel: 'Название колоды',
      namePlaceholder: 'например, Норвежский - Базовые слова',
      languageLabel: 'Язык слов (для озвучки)',
      languageDescription: 'Выберите язык слов в этой колоде',
    },

    collectionCard: {
      cards: 'карточек',
      lastStudied: 'Последнее изучение',
      neverStudied: 'Ещё не изучалось',
      study: 'Изучать',
      quiz: 'Квиз',
      edit: 'Редактировать',
      confirmDelete: 'Вы уверены, что хотите удалить эту колоду?',
    },

    flashcards: {
      title: 'Флешкарточки',
      mode: 'Режим: Флешкарточки',
      shuffle: 'Перемешать',
      card: 'Карточка',
      of: 'из',
      flipToSee: 'Нажмите, чтобы перевернуть',
      translation: 'Перевод',
      explanation: 'Объяснение',
      example: 'Пример',
      dontKnow: 'Не знаю',
      forgot: 'Забыл',
      remember: 'Помню',
      know: 'Знаю',
      sessionComplete: 'Сессия завершена!',
      statistics: 'Статистика',
      totalCards: 'Всего карточек',
      duration: 'Длительность',
      backToCollection: 'Назад к колоде',
      accuracy: 'Точность',
    },

    quiz: {
      title: 'Квиз',
      mode: 'Режим: Квиз',
      question: 'Вопрос',
      of: 'из',
      yourAnswer: 'Ваш ответ',
      correct: 'Правильно',
      incorrect: 'Неправильно',
      correctAnswer: 'Правильный ответ',
      checkAnswer: 'Проверить',
      nextQuestion: 'Далее',
      finishQuiz: 'Завершить',
      settings: 'Настройки',
      quizComplete: 'Квиз завершён!',
      statistics: 'Статистика',
      totalQuestions: 'Всего вопросов',
      correctAnswers: 'Правильных ответов',
      wrongAnswers: 'Неправильных ответов',
      accuracy: 'Точность',
      duration: 'Длительность',
      mistakes: 'Ошибки',
      restartQuiz: 'Начать заново',
      backToCollection: 'Назад к колоде',
      enterAnswer: 'Введите ответ',
      additionalInfo: 'Дополнительная информация',
      word: 'Слово',
      translation: 'Перевод',
      explanation: 'Объяснение',
      example: 'Пример',
    },

    editCollection: {
      title: 'Редактировать колоду',
      addCard: 'Добавить карточку',
      import: 'Импорт',
      export: 'Экспорт',
      noCards: 'Пока нет карточек',
      noCardsDescription: 'Добавьте первую карточку для начала обучения',
      word: 'Слово',
      translation: 'Перевод',
      partOfSpeech: 'Часть речи',
    },

    addCard: {
      title: 'Добавить карточку',
      wordLabel: 'Слово',
      wordPlaceholder: 'Введите слово',
      translationLabel: 'Перевод',
      translationPlaceholder: 'Введите перевод',
      explanationLabel: 'Объяснение',
      explanationPlaceholder: 'Введите объяснение (необязательно)',
      exampleLabel: 'Пример',
      examplePlaceholder: 'Введите пример предложения (необязательно)',
      partOfSpeechLabel: 'Часть речи',
      partOfSpeechPlaceholder: 'например, существительное, глагол, прилагательное',
    },

    profile: {
      pictureUrl: 'Введите URL изображения',
      editProfile: 'Редактировать',
      logout: 'Выйти',
      saveChanges: 'Сохранить изменения',
      displayName: 'Отображаемое имя',
      username: 'Имя пользователя',
      enterImageUrl: 'Введите URL изображения',
      confirmLogout: 'Вы уверены, что хотите выйти?',
      
      streak: {
        title: 'Ударный режим',
        daysInRow: 'дней в подряд',
        record: 'Рекорд',
        days: 'дней',
      },
      
      stats: {
        weekTitle: 'За неделю',
        sessions: 'Сессий',
        cardsStudied: 'Карточек изучено',
        studyTime: 'Время обучения',
        activityTitle: 'Активность',
        overallTitle: 'Общая статистика',
        totalCards: 'Всего карточек',
        flashcardSessions: 'Сессий флешкарточек',
        quizzesTaken: 'Пройдено квизов',
      },
      
      achievements: {
        title: 'Достижения',
      },
    },


    // Аутентификация
    auth: {
      login: {
        title: 'С возвращением',
        subtitle: 'Войдите, чтобы продолжить обучение',
        emailLabel: 'Email',
        emailPlaceholder: 'your@email.com',
        passwordLabel: 'Пароль',
        passwordPlaceholder: 'Введите пароль',
        loginButton: 'Войти',
        googleButton: 'Войти через Google',
        noAccount: 'Нет аккаунта?',
        register: 'Зарегистрироваться',
      },
      register: {
        title: 'Создать аккаунт',
        subtitle: 'Начните свой путь обучения',
        nameLabel: 'Имя',
        namePlaceholder: 'Ваше имя',
        emailLabel: 'Email',
        emailPlaceholder: 'your@email.com',
        passwordLabel: 'Пароль',
        passwordPlaceholder: 'Создайте пароль',
        confirmPasswordLabel: 'Подтвердите пароль',
        confirmPasswordPlaceholder: 'Подтвердите пароль',
        registerButton: 'Зарегистрироваться',
        googleButton: 'Зарегистрироваться через Google',
        haveAccount: 'Уже есть аккаунт?',
        login: 'Войти',
        passwordsDontMatch: 'Пароли не совпадают',
      },
    },   

    other: {
      settings: 'Настройки',
      updates: 'Kolo Обновления',
      privacy: 'Конфиденциальность',
      systemInfo: 'О системе',
      dataManagement: 'Экспорт и импорт',
      support: 'Поддержка',
      footer: 'Разработано',
    },

    settings: {
      soundEffects: 'Звуковые эффекты',
      soundEffectsDescription: 'Воспроизводить звуки для правильных/неправильных ответов',
      language: 'Язык интерфейса',
      languageDescription: 'Изменить язык интерфейса',
      theme: 'Тема',
      lightMode: 'Светлая',
      darkMode: 'Тёмная',
    },

    updates: {
      title: 'Kolo Sets',
      subtitle: 'Минималистичный инструмент для изучения норвежского языка, построенный на научном подходе интервальных повторений.',
      features: {
        efficiency: {
          title: 'Эффективность',
          description: 'Алгоритм SRS показывает слова именно тогда, когда вы готовы их забыть.',
        },
        privacy: {
          title: 'Приватность',
          description: 'Все ваши данные хранятся локально в браузере. Никаких серверов и сбора данных.',
        },
        simplicity: {
          title: 'Простота',
          description: 'Фокус на обучении, а не на настройках. Создавайте наборы и учитесь сразу.',
        },
      },
      versionsTitle: 'История версий',
      developedBy: 'Разработано',
    }, 
  },
};

// Получить текущий язык из localStorage
export const getCurrentLanguage = (): Language => {
  const saved = localStorage.getItem('appLanguage') as Language;
  return saved || 'en'; // По умолчанию английский
};

// Установить язык
export const setLanguage = (lang: Language): void => {
  localStorage.setItem('appLanguage', lang);
};

// Хук для использования переводов
export const useTranslations = (): Translations => {
  return translations[getCurrentLanguage()];
};
