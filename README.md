# react-todo

A simple Next.js (React + TypeScript) **shopping list** app with password-protected personal lists, styled with Material UI (с поддержкой светлой и тёмной темы) and backed by MongoDB.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a MongoDB Atlas cluster or another MongoDB instance.
3. Copy the connection string and set it in `.env.local` as `MONGODB_URI`:
   ```env
   MONGODB_URI="your-mongodb-connection-string"
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Features

- Персональный список по паролю (каждый пароль — отдельный набор покупок)
- Поддержка нескольких списков на один пароль
- Завершение списка переносит его в историю
- Просмотр завершённых списков из истории (клик по элементу истории)
- Совместный доступ: кнопка «Поделиться» генерирует ссылку с паролем и id списка (отправьте её другу, он увидит тот же список)
- URL-параметры `password` и `listId` позволяют открыть конкретный список напрямую
- Персонализация: отдельный пароль для управления категориями и шаблонами через удобную форму (не требуется JSON)
- Даты завершения показываются в формате `dd/mm/yyyy hh:mm`
- Редактирование строки: кнопка ✏️ позволяет изменять название, описание, комментарий, цвет, количество
- Добавление товара с названием, описанием и количеством
- Адаптивный интерфейс: элементы перестраиваются для мобильных экранов, кнопки растягиваются на всю ширину
- Темная тема: можно переключаться с помощью иконки солнца/луны в заголовке
- Отметка покупки как выполненной и возможность удаления (в активных списках)
- Комментарии и выбор цвета для каждой строки
- Редактирование существующих элементов
- Сделано адаптивно под мобильные экраны
- История списков открывается в модальном окне вместо обычной секции
- Современный дизайн на Material UI с обновлённой палитрой (пастельные тона), улучшенной типографикой и карточками с эффектом наведения
- Плавные анимации при добавлении/удалении элементов, появлении форм и переключении между активным списком и историей
- Русский интерфейс
- Backend API через Next.js маршруты и MongoDB

## Deployment (Vercel Free Plan)

1. Push the repository to GitHub (or another Git provider).
2. Import the project into [Vercel](https://vercel.com) via "New Project".
3. In the Vercel dashboard, navigate to **Settings → Environment Variables** and add:
   - `MONGODB_URI` with your Mongo DB connection string.
4. Deploy; Vercel will build and serve the Next.js app including the API routes.

The app uses the environment variable at runtime to connect to MongoDB. The free tier of Vercel supports this configuration.
