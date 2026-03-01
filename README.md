# wedding

Сайт-приглашение на свадьбу с общей ссылкой входа.

## Стек
- `frontend/`: Next.js (App Router), React Hook Form, Zod, TypeScript
- `backend/`: Express, Mongoose, Zod, TypeScript
- База: MongoDB Atlas

## Структура
- `frontend` - UI и flow гостя
- `backend` - API и работа с MongoDB

## Пользовательский flow
1. Гость открывает общую ссылку `/`.
2. На экране авторизации вводит `Имя + Фамилия`.
3. Backend находит или создает анкету по этой паре (дубликаты ФИО не закладываются).
4. Доступны разделы: `Дресс-код`, `Еда`, `Подарки`, `План дня`.
5. Раздел считается завершенным только после `Next`.
6. Индикаторы в табах:
- зеленая точка: раздел подтвержден (`acknowledged = true`)
- красная точка + `!`: пользователь покинул раздел без `Next`
7. После подтверждения всех разделов показывается финальный экран приглашения.
8. На финальном экране выполняется submit и доступна кнопка "поделиться" (общей ссылкой).
9. После submit редактирование доступно 30 дней (`editableUntil`), затем режим read-only.

## Модель данных MongoDB
```ts
{
  profileKey: string, // нормализованная пара firstName+lastName
  profile: {
    firstName: string,
    lastName: string
  },
  responses: {
    dresscode: {
      acknowledged: boolean
    },
    food: {
      acknowledged: boolean,
      selections?: {
        salad?: string[],
        appetizer?: string[],
        hot?: string[],
        drinks?: string[]
      },
      comment?: string // max 400
    },
    gifts: {
      acknowledged: boolean,
      selections?: string[]
    },
    plan: {
      acknowledged: boolean
    }
  },
  meta: {
    isSubmitted: boolean,
    editableUntil: Date | null
  }
}
```

## API
### `POST /api/invites/login`
Вход по `Имя + Фамилия` (поиск или создание анкеты).

Body:
```json
{
  "firstName": "Илья",
  "lastName": "Сиднев"
}
```

Ответ:
```json
{
  "invite": {
    "id": "66f0c2d8a59b9c1a6c4f08c1",
    "profile": { "firstName": "Илья", "lastName": "Сиднев" },
    "responses": {
      "dresscode": { "acknowledged": false },
      "food": { "acknowledged": false },
      "gifts": { "acknowledged": false },
      "plan": { "acknowledged": false }
    },
    "meta": { "isSubmitted": false, "editableUntil": null }
  },
  "readOnly": false
}
```

### `POST /api/invites/:inviteId/submit`
Финальная отправка анкеты.

Body:
```json
{
  "responses": {
    "dresscode": { "acknowledged": true },
    "food": {
      "acknowledged": true,
      "selections": {
        "salad": ["salad_caesar"],
        "hot": ["hot_beef"]
      },
      "comment": "Без орехов"
    },
    "gifts": {
      "acknowledged": true,
      "selections": ["gift_cash"]
    },
    "plan": { "acknowledged": true }
  }
}
```

## Локальный запуск
### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Открыть: `http://localhost:3000/`

## Что можно быстро доработать дальше
1. Подставить финальные массивы опций для еды/подарков.
2. Добавить брендинг-ассеты (логотип, фото, декоративные элементы из макета).
3. Добавить rate-limit для `/api/invites/login` и `/api/invites/:inviteId/submit`.
