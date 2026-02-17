// Переводы интерфейса

export type Language = 'en' | 'no' | 'ru';

export interface Translations {
  // Общие
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
  
  // Навигация
  nav: {
    home: string;
    about: string;
    profile: string;
  };
  
  // Главная страница
  home: {
    title: string;
    myDecks: string;
    noDecks: string;
    noDecksDescription: string;
    createDeck: string;
    addDeck: string;
    totalDecks: string;
  };
  
  // Создание коллекции
  createCollection: {
    title: string;
    nameLabel: string;
    namePlaceholder: string;
    languageLabel: string;
    languageDescription: string;
  };
  
  // Карточка коллекции
  collectionCard: {
    cards: string;
    lastStudied: string;
    neverStudied: string;
    study: string;
    quiz: string;
    edit: string;
    confirmDelete: string;
  };
  
  // Флешкарточки
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
  
  // Quiz
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
  };
  
  // Редактирование коллекции
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
  
  // Добавление карточки
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
  
  // Профиль
  profile: {
    title: string;
    editProfile: string;
    logout: string;
    saveChanges: string;
    displayName: string;
    username: string;
    enterImageUrl: string;
    confirmLogout: string;
    
    // Стрик
    streak: {
      title: string;
      days: string;
      record: string;
    };
    
    // Статистика
    stats: {
      weekTitle: string;
      sessions: string;
      cardsStudied: string;
      studyTime: string;
      activityTitle: string;
      last90Days: string;
      overallTitle: string;
      totalCards: string;
      flashcardSessions: string;
      quizzesTaken: string;
    };
    
    // Достижения
    achievements: {
      title: string;
      unlocked: string;
    };
    
    // Экспорт/Импорт
    exportImport: {
      title: string;
      exportAll: string;
      import: string;
      description: string;
      importSuccess: string;
      importError: string;
    };
  };
  
  // О приложении
  about: {
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
  
  // Настройки
  settings: {
    soundEffects: string;
    soundEffectsDescription: string;
    language: string;
    languageDescription: string;
    theme: string;
    lightMode: string;
    darkMode: string;
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
    
    // Навигация
    nav: {
      home: 'Home',
      about: 'About',
      profile: 'Profile',
    },
    
    // Главная страница
    home: {
      title: 'Home',
      myDecks: 'My decks',
      noDecks: "You don't have any decks yet",
      noDecksDescription: 'Create your first deck to start learning',
      createDeck: 'Create deck',
      addDeck: 'Add deck',
      totalDecks: 'Total decks',
    },
    
    // Создание коллекции
    createCollection: {
      title: 'Create new deck',
      nameLabel: 'Deck name',
      namePlaceholder: 'e.g., Norwegian - Basic words',
      languageLabel: 'Word language (for pronunciation)',
      languageDescription: 'Select the language of words in this deck',
    },
    
    // Карточка коллекции
    collectionCard: {
      cards: 'cards',
      lastStudied: 'Last studied',
      neverStudied: 'Never studied',
      study: 'Study',
      quiz: 'Quiz',
      edit: 'Edit',
      confirmDelete: 'Are you sure you want to delete this deck?',
    },
    
    // Флешкарточки
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
    
    // Quiz
    quiz: {
      title: 'Quiz',
      mode: 'Mode: Quiz',
      question: 'Question',
      of: 'of',
      yourAnswer: 'Your answer',
      correct: 'Correct!',
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
    },
    
    // Редактирование коллекции
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
    
    // Добавление карточки
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
    
    // Профиль
    profile: {
      title: 'Profile',
      editProfile: 'Edit profile',
      logout: 'Logout',
      saveChanges: 'Save changes',
      displayName: 'Display name',
      username: 'Username',
      enterImageUrl: 'Enter image URL',
      confirmLogout: 'Are you sure you want to logout?',
      
      streak: {
        title: 'Streak',
        days: 'days',
        record: 'Record',
      },
      
      stats: {
        weekTitle: 'This week',
        sessions: 'Sessions',
        cardsStudied: 'Cards studied',
        studyTime: 'Study time',
        activityTitle: 'Activity',
        last90Days: 'Last 90 days',
        overallTitle: 'Overall statistics',
        totalCards: 'Total cards',
        flashcardSessions: 'Flashcard sessions',
        quizzesTaken: 'Quizzes taken',
      },
      
      achievements: {
        title: 'Achievements',
        unlocked: 'unlocked',
      },
      
      exportImport: {
        title: 'Export & Import',
        exportAll: 'Export all decks',
        import: 'Import decks',
        description: 'Export creates a JSON file with all your decks. Import allows loading decks from a file.',
        importSuccess: 'Successfully imported {count} decks!',
        importError: 'Import error: {error}',
      },
    },
    
    // О приложении
    about: {
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
    
    // Настройки
    settings: {
      soundEffects: 'Sound effects',
      soundEffectsDescription: 'Play sounds for correct/incorrect answers',
      language: 'Interface language',
      languageDescription: 'Change interface language',
      theme: 'Theme',
      lightMode: 'Light',
      darkMode: 'Dark',
    },
  },
  
  no: {
    // Общие
    appName: 'Kolo Sets',
    loading: 'Laster...',
    save: 'Lagre',
    cancel: 'Avbryt',
    delete: 'Slett',
    edit: 'Rediger',
    create: 'Opprett',
    back: 'Tilbake',
    next: 'Neste',
    finish: 'Fullfør',
    close: 'Lukk',
    
    // Навигация
    nav: {
      home: 'Hjem',
      about: 'Om',
      profile: 'Profil',
    },
    
    // Главная страница
    home: {
      title: 'Hjem',
      myDecks: 'Mine kortstokker',
      noDecks: 'Du har ingen kortstokker ennå',
      noDecksDescription: 'Opprett din første kortstokk for å begynne å lære',
      createDeck: 'Opprett kortstokk',
      addDeck: 'Legg til kortstokk',
      totalDecks: 'Totalt kortstokker',
    },
    
    // Создание коллекции
    createCollection: {
      title: 'Opprett ny kortstokk',
      nameLabel: 'Navn på kortstokk',
      namePlaceholder: 'f.eks., Norsk - Grunnleggende ord',
      languageLabel: 'Ordspråk (for uttale)',
      languageDescription: 'Velg språket for ordene i denne kortstokken',
    },
    
    // Карточка коллекции
    collectionCard: {
      cards: 'kort',
      lastStudied: 'Sist studert',
      neverStudied: 'Aldri studert',
      study: 'Studer',
      quiz: 'Quiz',
      edit: 'Rediger',
      confirmDelete: 'Er du sikker på at du vil slette denne kortstokken?',
    },
    
    // Флешкарточки
    flashcards: {
      title: 'Flashkort',
      mode: 'Modus: Flashkort',
      shuffle: 'Bland',
      card: 'Kort',
      of: 'av',
      flipToSee: 'Klikk for å snu',
      translation: 'Oversettelse',
      explanation: 'Forklaring',
      example: 'Eksempel',
      dontKnow: 'Vet ikke',
      forgot: 'Glemt',
      remember: 'Husker',
      know: 'Kan',
      sessionComplete: 'Økt fullført!',
      statistics: 'Statistikk',
      totalCards: 'Totalt kort',
      duration: 'Varighet',
      backToCollection: 'Tilbake til kortstokk',
      accuracy: 'Nøyaktighet',
    },
    
    // Quiz
    quiz: {
      title: 'Quiz',
      mode: 'Modus: Quiz',
      question: 'Spørsmål',
      of: 'av',
      yourAnswer: 'Ditt svar',
      correct: 'Riktig!',
      incorrect: 'Feil',
      correctAnswer: 'Riktig svar',
      checkAnswer: 'Sjekk',
      nextQuestion: 'Neste',
      finishQuiz: 'Fullfør',
      settings: 'Innstillinger',
      quizComplete: 'Quiz fullført!',
      statistics: 'Statistikk',
      totalQuestions: 'Totalt spørsmål',
      correctAnswers: 'Riktige svar',
      wrongAnswers: 'Feil svar',
      accuracy: 'Nøyaktighet',
      duration: 'Varighet',
      mistakes: 'Feil',
      restartQuiz: 'Start quiz på nytt',
      backToCollection: 'Tilbake til kortstokk',
    },
    
    // Редактирование коллекции
    editCollection: {
      title: 'Rediger kortstokk',
      addCard: 'Legg til kort',
      import: 'Importer',
      export: 'Eksporter',
      noCards: 'Ingen kort ennå',
      noCardsDescription: 'Legg til ditt første kort for å begynne å lære',
      word: 'Ord',
      translation: 'Oversettelse',
      partOfSpeech: 'Ordklasse',
    },
    
    // Добавление карточки
    addCard: {
      title: 'Legg til kort',
      wordLabel: 'Ord',
      wordPlaceholder: 'Skriv inn ord',
      translationLabel: 'Oversettelse',
      translationPlaceholder: 'Skriv inn oversettelse',
      explanationLabel: 'Forklaring',
      explanationPlaceholder: 'Skriv inn forklaring (valgfritt)',
      exampleLabel: 'Eksempel',
      examplePlaceholder: 'Skriv inn eksempelsetning (valgfritt)',
      partOfSpeechLabel: 'Ordklasse',
      partOfSpeechPlaceholder: 'f.eks., substantiv, verb, adjektiv',
    },
    
    // Профиль
    profile: {
      title: 'Profil',
      editProfile: 'Rediger profil',
      logout: 'Logg ut',
      saveChanges: 'Lagre endringer',
      displayName: 'Visningsnavn',
      username: 'Brukernavn',
      enterImageUrl: 'Skriv inn bilde-URL',
      confirmLogout: 'Er du sikker på at du vil logge ut?',
      
      streak: {
        title: 'Rekke',
        days: 'dager',
        record: 'Rekord',
      },
      
      stats: {
        weekTitle: 'Denne uken',
        sessions: 'Økter',
        cardsStudied: 'Kort studert',
        studyTime: 'Studietid',
        activityTitle: 'Aktivitet',
        last90Days: 'Siste 90 dager',
        overallTitle: 'Samlet statistikk',
        totalCards: 'Totalt kort',
        flashcardSessions: 'Flashkort-økter',
        quizzesTaken: 'Quiz tatt',
      },
      
      achievements: {
        title: 'Prestasjoner',
        unlocked: 'låst opp',
      },
      
      exportImport: {
        title: 'Eksport og import',
        exportAll: 'Eksporter alle kortstokker',
        import: 'Importer kortstokker',
        description: 'Eksport oppretter en JSON-fil med alle kortstokkene dine. Import lar deg laste inn kortstokker fra en fil.',
        importSuccess: 'Vellykket import av {count} kortstokker!',
        importError: 'Importfeil: {error}',
      },
    },
    
    // О приложении
    about: {
      title: 'Kolo Sets',
      subtitle: 'Minimalistisk verktøy for å lære norsk bygget på vitenskapelig tilnærming til repetisjoner.',
      features: {
        efficiency: {
          title: 'Effektivitet',
          description: 'SRS-algoritmen viser ord akkurat når du er i ferd med å glemme dem.',
        },
        privacy: {
          title: 'Personvern',
          description: 'All dataene dine lagres lokalt i nettleseren. Ingen servere eller datainnsamling.',
        },
        simplicity: {
          title: 'Enkelhet',
          description: 'Fokuser på læring, ikke på innstillinger. Opprett sett og begynn å lære med en gang.',
        },
      },
      versionsTitle: 'Versjonshistorikk',
      developedBy: 'Utviklet av',
    },
    
    // Аутентификация
    auth: {
      login: {
        title: 'Velkommen tilbake',
        subtitle: 'Logg inn for å fortsette å lære',
        emailLabel: 'E-post',
        emailPlaceholder: 'din@epost.no',
        passwordLabel: 'Passord',
        passwordPlaceholder: 'Skriv inn passord',
        loginButton: 'Logg inn',
        googleButton: 'Logg inn med Google',
        noAccount: 'Har du ingen konto?',
        register: 'Registrer deg',
      },
      register: {
        title: 'Opprett konto',
        subtitle: 'Start din læringsreise',
        nameLabel: 'Navn',
        namePlaceholder: 'Ditt navn',
        emailLabel: 'E-post',
        emailPlaceholder: 'din@epost.no',
        passwordLabel: 'Passord',
        passwordPlaceholder: 'Opprett passord',
        confirmPasswordLabel: 'Bekreft passord',
        confirmPasswordPlaceholder: 'Bekreft passord',
        registerButton: 'Registrer deg',
        googleButton: 'Registrer deg med Google',
        haveAccount: 'Har du allerede en konto?',
        login: 'Logg inn',
        passwordsDontMatch: 'Passordene stemmer ikke overens',
      },
    },
    
    // Настройки
    settings: {
      soundEffects: 'Lydeffekter',
      soundEffectsDescription: 'Spill av lyder for riktige/feil svar',
      language: 'Grensesnittspråk',
      languageDescription: 'Endre grensesnittspråk',
      theme: 'Tema',
      lightMode: 'Lys',
      darkMode: 'Mørk',
    },
  },
  
  ru: {
    // Общие
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
    
    // Навигация
    nav: {
      home: 'Главная',
      about: 'О приложении',
      profile: 'Профиль',
    },
    
    // Главная страница
    home: {
      title: 'Главная',
      myDecks: 'Мои колоды',
      noDecks: 'У вас пока нет колод',
      noDecksDescription: 'Создайте первую колоду для начала обучения',
      createDeck: 'Создать колоду',
      addDeck: 'Добавить колоду',
      totalDecks: 'Всего колод',
    },
    
    // Создание коллекции
    createCollection: {
      title: 'Создать новую колоду',
      nameLabel: 'Название колоды',
      namePlaceholder: 'например, Норвежский - Базовые слова',
      languageLabel: 'Язык слов (для озвучки)',
      languageDescription: 'Выберите язык слов в этой колоде',
    },
    
    // Карточка коллекции
    collectionCard: {
      cards: 'карточек',
      lastStudied: 'Последнее изучение',
      neverStudied: 'Ещё не изучалось',
      study: 'Изучать',
      quiz: 'Квиз',
      edit: 'Редактировать',
      confirmDelete: 'Вы уверены, что хотите удалить эту колоду?',
    },
    
    // Флешкарточки
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
    
    // Quiz
    quiz: {
      title: 'Квиз',
      mode: 'Режим: Квиз',
      question: 'Вопрос',
      of: 'из',
      yourAnswer: 'Ваш ответ',
      correct: 'Правильно!',
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
    },
    
    // Редактирование коллекции
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
    
    // Добавление карточки
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
    
    // Профиль
    profile: {
      title: 'Профиль',
      editProfile: 'Редактировать профиль',
      logout: 'Выйти',
      saveChanges: 'Сохранить изменения',
      displayName: 'Отображаемое имя',
      username: 'Имя пользователя',
      enterImageUrl: 'Введите URL изображения',
      confirmLogout: 'Вы уверены, что хотите выйти?',
      
      streak: {
        title: 'Ударный режим',
        days: 'дней',
        record: 'Рекорд',
      },
      
      stats: {
        weekTitle: 'За неделю',
        sessions: 'Сессий',
        cardsStudied: 'Карточек изучено',
        studyTime: 'Время обучения',
        activityTitle: 'Активность',
        last90Days: 'Последние 90 дней',
        overallTitle: 'Общая статистика',
        totalCards: 'Всего карточек',
        flashcardSessions: 'Сессий флешкарточек',
        quizzesTaken: 'Пройдено квизов',
      },
      
      achievements: {
        title: 'Достижения',
        unlocked: 'разблокировано',
      },
      
      exportImport: {
        title: 'Экспорт и импорт',
        exportAll: 'Экспортировать все колоды',
        import: 'Импортировать колоды',
        description: 'Экспорт создаст JSON файл со всеми вашими колодами. Импорт позволит загрузить колоды из файла.',
        importSuccess: 'Успешно импортировано {count} колод!',
        importError: 'Ошибка импорта: {error}',
      },
    },
    
    // О приложении
    about: {
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
    
    // Настройки
    settings: {
      soundEffects: 'Звуковые эффекты',
      soundEffectsDescription: 'Воспроизводить звуки для правильных/неправильных ответов',
      language: 'Язык интерфейса',
      languageDescription: 'Изменить язык интерфейса',
      theme: 'Тема',
      lightMode: 'Светлая',
      darkMode: 'Тёмная',
    },
  },
};

// Получить текущий язык из localStorage
export const getCurrentLanguage = (): Language => {
  const saved = localStorage.getItem('appLanguage') as Language;
  return saved || 'no'; // По умолчанию норвежский
};

// Установить язык
export const setLanguage = (lang: Language): void => {
  localStorage.setItem('appLanguage', lang);
};

// Хук для использования переводов
export const useTranslations = (): Translations => {
  return translations[getCurrentLanguage()];
};
