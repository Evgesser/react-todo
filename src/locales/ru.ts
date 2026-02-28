export const ru = {
  // Auth
  auth: {
    username: 'Пользователь',
    password: 'Пароль',
    login: 'Вход',
    logout: 'Выход',
    loading: 'Загрузка...',
    usernamePlaceholder: 'Введите имя пользователя',
    passwordPlaceholder: 'Введите пароль',
    userNotFound: 'Пользователь не найден',
    createAccount: 'Создать аккаунт',
  },

  // Registration
  register: {
    title: 'Пользователь не найден',
    captchaLabel: 'Подтвердите, что вы человек:',
    captchaPlaceholder: 'Введите ответ',
    captchaError: 'Неверный ответ',
    register: 'Создать аккаунт',
    cancel: 'Отмена',
    registering: 'Создание...',
    success: 'Аккаунт создан!',
    userExists: 'Пользователь уже существует',
  },
  
  // Header
  header: {
    title: 'Список покупок',
    profile: 'Профиль',
    logout: 'Выход',
  },
  
  // Lists
  lists: {
    selectList: 'Список',
    newList: 'Новый список',
    listColor: 'Цвет списка',
    saveColor: 'Сохранить цвет',
    history: 'История',
    bulkMode: 'Мн. выбор',
    bulkCancel: 'Отмена мн. выбора',
    logout: 'Выйти',
    deleteList: 'Удалить список',
    completeList: 'Завершить список',
    share: 'Поделиться',
    linkCopied: 'Ссылка скопирована',
    noLists: 'Нет списков',
  },
  
  // Todos
  todos: {
    addEdit: 'Добавить / редактировать',
    name: 'Название',
    namePlaceholder: 'Что купить?',
    description: 'Описание',
    descriptionPlaceholder: 'Дополнительная информация',
    quantity: 'Количество',
    comment: 'Комментарий',
    commentPlaceholder: 'Заметки к товару',
    color: 'Цвет',
    category: 'Категория',
    add: 'Добавить',
    save: 'Сохранить',
    cancel: 'Отменить',
    edit: 'Редактировать',
    delete: 'Удалить',
    completed: 'Выполнено',
    active: 'Активные',
    all: 'Все',
  },
  
  // Search
  search: {
    placeholder: 'Поиск',
    bulkComplete: 'Пометить выполненными',
    bulkDelete: 'Удалить выбранные',
    cancelBulk: 'Отменить',
  },
  
  // Dialogs
  dialogs: {
    newList: {
      title: 'Новый список',
      name: 'Название',
      template: 'Шаблон',
      noTemplate: '(нет)',
      create: 'Создать',
      cancel: 'Отмена',
      error: 'Не удалось создать список',
    },
    
    quantity: {
      title: 'Количество',
      save: 'Сохранить',
      cancel: 'Отмена',
    },
    
    history: {
      title: 'История списков',
      noHistory: 'Нет завершенных списков',
      view: 'Посмотреть',
      deleteAll: 'Удалить все',
      close: 'Закрыть',
    },
    
    personalization: {
      title: 'Персонализация',
      categories: 'Категории',
      templates: 'Шаблоны',
      categoryValue: 'Значение',
      categoryLabel: 'Метка',
      addCategory: 'Добавить категорию',
      templateName: 'Название шаблона',
      items: 'Пункты',
      itemName: 'Название',
      itemQuantity: 'Кол-во',
      itemCategory: 'Категория',
      addItem: 'Добавить пункт',
      addTemplate: 'Добавить шаблон',
      save: 'Сохранить',
      close: 'Закрыть',
    },
  },
  
  // Messages
  messages: {
    listCreated: 'Список создан',
    listDeleted: 'Список удален',
    listCompleted: 'Список завершен',
    colorSaved: 'Цвет сохранен',
    loadListsError: 'Не удалось загрузить списки',
    deleteListError: 'Не удалось удалить список',
    colorUpdateError: 'Не удалось обновить цвет',
    completeListError: 'Не удалось завершить список',
    itemAdded: 'Товар добавлен',
    itemUpdated: 'Товар обновлен',
    itemDeleted: 'Товар удален',
    notAuthenticated: 'Пользователь не авторизован',
    personalizationSaved: 'Настройки сохранены',
    personalizationSaveError: 'Ошибка при сохранении',
    createError: 'Ошибка при создании',
    error: 'Ошибка',
  },
  
  // Buttons
  buttons: {
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    close: 'Закрыть',
    add: 'Добавить',
    edit: 'Редактировать',
    create: 'Создать',
    personalize: 'Персонализация',
  },
  
  // Contrast
  contrast: {
    good: 'Контраст хороший',
    warning: 'Внимание: средний контраст',
  },
  
  // Profile
  profile: {
    title: 'Профиль',
    email: 'Email',
    bio: 'О себе',
    avatar: 'Аватар',
    changeAvatar: 'Изменить аватар',
    editProfile: 'Редактировать профиль',
    saveChanges: 'Сохранить изменения',
    memberSince: 'Участник с',
    notSet: 'Не указано',
    profileUpdated: 'Профиль обновлён',
    passwordChanged: 'Пароль изменён',
    accountDeleted: 'Аккаунт удалён',
    changePassword: 'Изменить пароль',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите пароль',
    deleteAccount: 'Удалить аккаунт',
    deleteWarning: 'Это действие необнеобратимо. Все ваши данные будут удалены навсегда.',
    enterPasswordToConfirm: 'Введите пароль для подтверждения',
    passwordsDoNotMatch: 'Пароли не совпадают',
  },
};

export type TranslationKeys = typeof ru;
