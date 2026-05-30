# Деплой: Supabase + Vercel + хостинг ML-бэкенда

Архитектура в облаке:

```
Vercel      →  Frontend (React)
Supabase    →  PostgreSQL  +  Storage (снимки и Grad-CAM)
Render      →  FastAPI + PyTorch (ML-инференс)   ← PyTorch не влезает в Vercel
```

> Почему бэкенд не на Vercel: зависимости (torch + opencv + albumentations) превышают
> лимит serverless-функций Vercel (250 МБ). Поэтому ML-API хостится в контейнере (Render/Railway/Fly).

---

## Шаг 1. Supabase (база данных + хранилище)

1. Создайте проект на https://supabase.com (бесплатный тариф).
2. **Database → Connect** → скопируйте строку **Session Pooler** (порт 5432):
   ```
   postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```
   Это будет `DATABASE_URL`.
3. **Storage → New bucket** → имя `scans`, отметьте **Public**.
4. **Project Settings → API** → скопируйте:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` ключ → `SUPABASE_SERVICE_KEY`

---

## Шаг 2. ML-бэкенд на Render

Бэкенд должен лежать в git-репозитории на GitHub.

1. Запушьте проект на GitHub.
2. На https://dashboard.render.com → **New → Blueprint** → выберите репозиторий
   (Render подхватит `backend/render.yaml`).
3. Задайте переменные окружения (Environment):
   | Переменная | Значение |
   |---|---|
   | `DATABASE_URL` | строка Session Pooler из Supabase |
   | `SECRET_KEY` | длинная случайная строка |
   | `FRONTEND_URL` | `https://<app>.vercel.app` (заполнить после шага 3) |
   | `SUPABASE_URL` | из Supabase |
   | `SUPABASE_SERVICE_KEY` | service_role ключ |
   | `SUPABASE_BUCKET` | `scans` |
4. После первого деплоя инициализируйте БД (Render → Shell):
   ```
   python init_db.py
   ```
   Создадутся таблицы и тестовые пользователи (см. ниже).
5. Запомните адрес сервиса, например `https://odir-backend.onrender.com`.

> На free-тарифе Render сервис «засыпает» после простоя — первый запрос будет медленным (cold start).

---

## Шаг 3. Frontend на Vercel

1. На https://vercel.com → **Add New → Project** → выберите репозиторий, **Root Directory** = `frontend`.
2. Framework Preset определится как **Create React App**.
3. Environment Variables:
   | Переменная | Значение |
   |---|---|
   | `REACT_APP_API_URL` | адрес бэкенда с Render, напр. `https://odir-backend.onrender.com` |
4. Deploy. Получите адрес `https://<app>.vercel.app`.
5. Вернитесь в Render и впишите этот адрес в `FRONTEND_URL`, передеплойте бэкенд (для CORS).

---

## Тестовые пользователи (после `init_db.py`)

| Роль | Логин | Пароль |
|------|-------|--------|
| Admin | admin@odir.local | Admin@123 |
| Doctor | doctor@odir.local | Doctor@123 |
| Analyst | analyst@odir.local | Analyst@123 |

⚠️ Смените пароли и `SECRET_KEY` для реального использования.

---

## Локальный запуск (без облака)

Если `SUPABASE_*` не заданы — файлы пишутся на локальный диск, БД берётся из `DATABASE_URL`.

**Бэкенд:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # заполнить DATABASE_URL
python init_db.py
uvicorn main:app --reload
```

**Фронтенд:**
```bash
cd frontend
npm install
npm start    # использует .env.development → http://localhost:8000
```
