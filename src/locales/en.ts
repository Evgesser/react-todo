import { TranslationKeys } from './ru';

export const en: TranslationKeys = {
  // Auth
  auth: {
    username: 'Username',
    password: 'Password',
    login: 'Login',
    logout: 'Logout',
    loading: 'Loading...',
    usernamePlaceholder: 'Enter username',
    passwordPlaceholder: 'Enter password',
    userNotFound: 'User not found',
    createAccount: 'Create account',
  },

  // Registration
  register: {
    title: 'User not found',
    captchaLabel: 'Verify you are human:',
    captchaPlaceholder: 'Enter answer',
    captchaError: 'Incorrect answer',
    register: 'Create account',
    cancel: 'Cancel',
    registering: 'Creating...',
    success: 'Account created!',
    userExists: 'User already exists',
  },
  
  // Header
  header: {
    title: 'Shopping List',
    profile: 'Profile',
    logout: 'Logout',
  },
  
  // Lists
  lists: {
    selectList: 'List',
    newList: 'New List',
    listColor: 'List Color',
    saveColor: 'Save Color',
    history: 'History',
    bulkMode: 'Multi Select',
    bulkCancel: 'Cancel Multi Select',
    logout: 'Logout',
    deleteList: 'Delete List',
    completeList: 'Complete List',
    share: 'Share',
    linkCopied: 'Link copied',
    noLists: 'No Lists',
  },
  
  // Todos
  todos: {
    addEdit: 'Add / Edit',
    name: 'Name',
    namePlaceholder: 'What to buy?',
    description: 'Description',
    descriptionPlaceholder: 'Additional information',
    quantity: 'Quantity',
    comment: 'Comment',
    commentPlaceholder: 'Item notes',
    color: 'Color',
    category: 'Category',
    add: 'Add',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    completed: 'Completed',
    active: 'Active',
    all: 'All',
  },
  
  // Search
  search: {
    placeholder: 'Search',
    bulkComplete: 'Mark as Completed',
    bulkDelete: 'Delete Selected',
    cancelBulk: 'Cancel',
  },
  
  // Dialogs
  dialogs: {
    newList: {
      title: 'New List',
      name: 'Name',
      template: 'Template',
      noTemplate: '(none)',
      create: 'Create',
      cancel: 'Cancel',
      error: 'Failed to create list',
    },
    
    quantity: {
      title: 'Quantity',
      save: 'Save',
      cancel: 'Cancel',
    },
    
    history: {
      title: 'List History',
      noHistory: 'No completed lists',
      view: 'View',
      deleteAll: 'Delete All',
      close: 'Close',
    },
    
    personalization: {
      title: 'Personalization',
      categories: 'Categories',
      templates: 'Templates',
      categoryValue: 'Value',
      categoryLabel: 'Label',
      addCategory: 'Add Category',
      templateName: 'Template Name',
      items: 'Items',
      itemName: 'Name',
      itemQuantity: 'Qty',
      itemCategory: 'Category',
      addItem: 'Add Item',
      addTemplate: 'Add Template',
      save: 'Save',
      close: 'Close',
    },
  },
  
  // Messages
  messages: {
    listCreated: 'List created',
    listDeleted: 'List deleted',
    listCompleted: 'List completed',
    colorSaved: 'Color saved',
    loadListsError: 'Failed to load lists',
    deleteListError: 'Failed to delete list',
    colorUpdateError: 'Failed to update color',
    completeListError: 'Failed to complete list',
    itemAdded: 'Item added',
    itemUpdated: 'Item updated',
    itemDeleted: 'Item deleted',
    notAuthenticated: 'User not authenticated',
    personalizationSaved: 'Settings saved',
    personalizationSaveError: 'Failed to save settings',
    createError: 'Creation error',
    error: 'Error',
  },
  
  // Buttons
  buttons: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    close: 'Close',
    add: 'Add',
    edit: 'Edit',
    create: 'Create',
    personalize: 'Personalize',
  },
  
  // Contrast
  contrast: {
    good: 'Good contrast',
    warning: 'Warning: medium contrast',
  },
  
  // Profile
  profile: {
    title: 'Profile',
    email: 'Email',
    bio: 'Bio',
    avatar: 'Avatar',
    changeAvatar: 'Change Avatar',
    editProfile: 'Edit Profile',
    saveChanges: 'Save Changes',
    memberSince: 'Member since',
    notSet: 'Not set',
    profileUpdated: 'Profile updated successfully',
    passwordChanged: 'Password changed successfully',
    accountDeleted: 'Account deleted successfully',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    deleteAccount: 'Delete Account',
    deleteWarning: 'This action cannot be undone. All your data will be permanently deleted.',
    enterPasswordToConfirm: 'Enter your password to confirm',
    passwordsDoNotMatch: 'Passwords do not match',
  },
};
