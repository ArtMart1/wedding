# wedding

Сайт-приглашение на свадьбу с единым Next.js приложением и встроенным API.

## Стек
- `frontend/`: Next.js (App Router), Route Handlers, Mongoose, React Hook Form, Zod, TypeScript
- База: MongoDB Atlas
- `backend/`: legacy Express-реализация, оставлена как референс на время миграции

## Структура
- `frontend` - UI, API и работа с MongoDB
- `backend` - старый отдельный backend, больше не обязателен для деплоя

## Пользовательский flow
1. Гость открывает общую ссылку `/`.
2. На экране авторизации вводит `Имя + Фамилия`.
3. API находит или создает анкету по этой паре.
4. Доступны разделы: `Дресс-код`, `Еда`, `Подарки`, `План дня`.
5. Черновик анкеты сохраняется автоматически по debounce и при уходе со страницы.
6. После заполнения всех разделов выполняется финальный submit.
7. После submit редактирование доступно 30 дней (`editableUntil`), затем режим read-only.

## Модель данных MongoDB
```ts
{
  profileKey: string,
  profile: {
    firstName: string,
    lastName: string
  },
  responses: {
    dresscode: {},
    food: {
      selections?: {
        salad?: string[],
        hot?: string[],
        drinks?: string[]
      },
      comment?: string
    },
    gifts: {
      selections?: string[]
    },
    plan: {}
  },
  progress: {
    dresscode: {
      viewedByMode: {
        male: number,
        female: number
      },
      completed: boolean
    },
    plan: {
      opened: boolean,
      downloaded: boolean
    }
  },
  meta: {
    isSubmitted: boolean,
    editableUntil: Date | null,
    draftUpdatedAt: Date | null,
    submittedAt: Date | null
  },
  authSession: {
    tokenHash: string | null,
    expiresAt: Date | null
  }
}
```

## API
### `POST /api/invites/login`
Вход по `Имя + Фамилия` с установкой `httpOnly` cookie.

### `GET /api/invites/session`
Восстановление сессии по cookie.

### `PATCH /api/invites/:inviteId/draft`
Сохранение неполного черновика анкеты.

### `POST /api/invites/:inviteId/submit`
Финальная отправка анкеты.

## Локальный запуск
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Пример `frontend/.env.local`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/wedding
```

Если используешь MongoDB Atlas, подставь свой connection string в `MONGODB_URI`.

Открыть: `http://localhost:3000/`

## Деплой
Текущая целевая схема:
- один Vercel project с root directory = `frontend`
- `MONGODB_URI` в environment variables
- отдельный backend-проект больше не нужен
