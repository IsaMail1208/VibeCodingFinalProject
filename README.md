# Vibe Chat

Короткое описание: учебный веб-чат с REST API на **FastAPI**, хранением в **SQLite** и простым фронтендом (HTML/CSS/JS). Подходит для финального проекта курса Vibe Coding.

## Возможности

- Регистрация пользователя, список пользователей, поиск по имени или email
- Отправка и получение сообщений (личный чат 1:1), история переписки
- Поиск по тексту в текущей переписке; фильтрация сообщений по отправителю, получателю и паре пользователей через API
- Веб-интерфейс: список пользователей, поле ввода, окно чата, опрос новых сообщений
- Дополнительно: тёмная тема, индикатор «печатает…», поддержка эмодзи в тексте, **Docker**

## Технологии

- Python 3.12+, FastAPI, Uvicorn  
- SQLAlchemy 2, SQLite  
- Pydantic, passlib (pbkdf2_sha256)  
- Фронтенд: статические файлы без сборщика  
- Тесты: pytest, httpx (TestClient)

## Как запустить локально

```powershell
cd "c:\Users\user\Desktop\Salymbekov University\2 курс\VibeCodingFinalProject"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Откройте в браузере: `http://127.0.0.1:8000/`

Тесты:

```powershell
pytest -q
```

Docker:

```powershell
docker build -t vibe-chat .
docker run -p 8000:8000 vibe-chat
```

## Ссылка на живой сайт

_TODO: замените на реальную ссылку после деплоя (Render и т.д.):_  
**https://your-app.onrender.com**

## Ссылка на демо-видео (YouTube)

_TODO: после записи 2–3 минут вставьте ссылку:_  
**https://www.youtube.com/watch?v=...**

## Скриншоты

_Добавьте изображения в репозиторий (например, `docs/screenshot.png`) и вставьте ссылки сюда._

## Сдача проекта

- Публичный репозиторий GitHub с полным кодом  
- Письмо на **kyrgyzstanait@gmail.com**, тема: `Vibe Coding Final Project – Ваше ФИО`  
- Соблюдение дедлайна из задания

## GitHub (публикация)

В этом проекте уже есть `.gitignore`. Если вы ещё не залили код на GitHub:

```powershell
cd "c:\Users\user\Desktop\Salymbekov University\2 курс\VibeCodingFinalProject"

# 1) На GitHub создайте пустой репозиторий (Public)
# 2) Привяжите remote и отправьте код
git remote add origin https://github.com/<username>/<repo>.git
git branch -M main
git push -u origin main
```

Если GitHub попросит авторизацию — используйте GitHub CLI или Personal Access Token.

## Render (деплой)

Рекомендуемый вариант — **Blueprint** через файл `render.yaml` (он уже добавлен в репозиторий):

1) Залейте код на GitHub (публичный репозиторий)
2) Откройте Render → **New** → **Blueprint**
3) Выберите ваш репозиторий и подтвердите создание сервиса
4) После деплоя откройте сайт и проверьте `/api/health`

Если билд падает на `pydantic-core`/Rust: убедитесь, что в Render используется Python 3.12+ с готовыми wheels. В `render.yaml` уже задано `PYTHON_VERSION=3.12.3`.

Примечание про SQLite: на Render файловая система контейнера может быть временной, поэтому данные могут сбрасываться при пересборке/перезапуске. Если нужна сохранность данных — подключите **persistent disk** в Render и задайте переменную `DATA_DIR` (или используйте внешний Postgres).

Вариант 1 — как Python Web Service (без Docker):

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Вариант 2 — Docker (если хотите деплоить контейнер):

- Render сам соберёт Dockerfile
- Порт берётся из переменной `PORT` (см. `Dockerfile`)

## API (кратко)

| Метод | Путь | Описание |
|--------|------|-----------|
| GET | `/api/health` | Проверка работы |
| POST | `/api/users` | Регистрация |
| GET | `/api/users?q=` | Список / поиск |
| GET | `/api/users/{id}` | Один пользователь |
| POST | `/api/messages` | Отправить сообщение |
| GET | `/api/messages/conversation/{a}/{b}?search=` | История между двумя пользователями |
| GET | `/api/messages` | Список с параметрами `sender_id`, `receiver_id`, `user_a`+`user_b`, `search` |

Интерактивная документация: `http://127.0.0.1:8000/docs`
